use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use spl_token::instruction::AuthorityType;
use std::convert::TryInto;

declare_id!("BjrMMxAWG9YBuoY6mv7h5dZRbKQrFSwi88sJPSpW2HPC");

pub mod constants {
    pub const SUSHI_TOKEN_MINT_PUBKEY: &str = "6zV9gwGAKNa8PBHSed99hrFixCLSSv4Dx9Fqj2QZhjwh";
    pub const X_SUSHI_TOKEN_MINT_PUBKEY: &str = "EJ57o3yQy518DzQM9juQSuStdqZur1fkvPXYjMBNcJZs";
}

#[program]
pub mod soshi {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, _nonce: u8) -> ProgramResult {
        Ok(())
    }

    // user can stake their sushi token and get back xsushi
    pub fn stake(ctx: Context<Stake>, nonce:u8, amount: u64) -> ProgramResult {
        // no. of sushi token in pool
        let total_sushi_token = ctx.accounts.sushi_vault.amount;
        
        // total x_sushi in circulation
        let total_xsushi_token = ctx.accounts.xsushi_mint.supply;

        // pool price basically the ratio between sushi_in_pool/xsushi_in_circulation
        let old_price = get_price(&ctx.accounts.sushi_vault, &ctx.accounts.xsushi_mint);

        let token_mint_key = ctx.accounts.sushi_mint.key();
        let seeds = &[token_mint_key.as_ref(), &[nonce]];
        let signer = [&seeds[..]];

        // mint xsushi token
        if total_sushi_token == 0 || total_xsushi_token == 0 {
            msg!("lol failed ");
            // no math reqd, we mint them the amount they sent us as 1:1
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.xsushi_mint.to_account_info(),
                    to: ctx.accounts.user_xsushi_token_account.to_account_info(),
                    authority: ctx.accounts.sushi_vault.to_account_info(),
                },
                &signer,
            );
            token::mint_to(cpi_ctx, amount)?;
        } else {
            // calculating how much xSushi we have to mint for corresponding sushi token
            let how_much_xsushi: u64 = (amount as u128)
                .checked_mul(total_xsushi_token as u128)
                .unwrap()
                .checked_div(total_sushi_token as u128)
                .unwrap()
                .try_into()
                .unwrap();
                
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.xsushi_mint.to_account_info(),
                    to: ctx.accounts.user_xsushi_token_account.to_account_info(),
                    authority: ctx.accounts.sushi_vault.to_account_info(),
                },
                &signer,
            );
            token::mint_to(cpi_ctx, how_much_xsushi)?;
        }

        // transfer user sushi_token to the vault
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.user_sushi_token_account.to_account_info(),
                to: ctx.accounts.sushi_vault.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, amount)?;

        // reload the data inside the account
        (&mut ctx.accounts.sushi_vault).reload()?;
        (&mut ctx.accounts.xsushi_mint).reload()?;

        // calculating new price
        let new_price = get_price(&ctx.accounts.sushi_vault, &ctx.accounts.xsushi_mint);

        // emiting the price change
        emit!(PriceChange {
            old_sushi_per_xushi_e9: old_price.0,
            old_sushi_per_xsushi: old_price.1,
            new_sushi_per_xsushi_e9: new_price.0,
            new_sushi_per_xsushi: new_price.1,
        });
        Ok(())
    }

    // user can burn their xsushi token inorder to get back their sushi and some extra sushi, which they earned over staked period of time
    pub fn unstake(ctx: Context<Unstake>, nonce: u8, amount: u64) -> ProgramResult {
        // no. of sushi token in pool
        let total_sushi_token = ctx.accounts.sushi_vault.amount;
        
        // total x_sushi in circulation
        let total_xsushi_token = ctx.accounts.xsushi_mint.supply;

        // pool price basically the ratio between sushi_in_pool/xsushi_in_circulation
        let old_price = get_price(&ctx.accounts.sushi_vault, &ctx.accounts.xsushi_mint);
        
        // burn what is being sent
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Burn {
                mint: ctx.accounts.xsushi_mint.to_account_info(),
                to: ctx.accounts.user_xsushi_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        token::burn(cpi_ctx, amount)?;

        // detemine user share of vault
        let user_share: u64 = (amount as u128)
            .checked_mul(total_sushi_token as u128)
            .unwrap()
            .checked_div(total_xsushi_token as u128)
            .unwrap()
            .try_into()
            .unwrap();

        // compute vault signer seed
        let sushi_token_mint = ctx.accounts.sushi_mint.key();
        let seeds = &[sushi_token_mint.as_ref(), &[nonce]];
        let signer = &[&seeds[..]];

        // transfer from vault to user
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.sushi_vault.to_account_info(),
                to: ctx.accounts.user_sushi_token_account.to_account_info(),
                authority: ctx.accounts.sushi_vault.to_account_info(),
            },
            signer,
        );

        token::transfer(cpi_ctx, user_share)?;
        
        // reload the data inside the account
        (&mut ctx.accounts.sushi_vault).reload()?;
        (&mut ctx.accounts.xsushi_mint).reload()?;

        // calculating new price
        let new_price = get_price(&ctx.accounts.sushi_vault, &ctx.accounts.xsushi_mint);

        // emiting the price change
        emit!(PriceChange {
            old_sushi_per_xushi_e9: old_price.0,
            old_sushi_per_xsushi: old_price.1,
            new_sushi_per_xsushi_e9: new_price.0,
            new_sushi_per_xsushi: new_price.1,
        });

        Ok(())
    }
}

const E9: u128 = 100_000_000;

pub fn get_price<'info>(
    vault: &Account<'info, TokenAccount>,
    mint: &Account<'info, Mint>,
) -> (u64, String) {
    // total sushi token in vault
    let total_sushi_token = vault.amount;
    // total xsushi in circulation
    let total_xsushi_token = mint.supply;

    if total_xsushi_token == 0 {
        return (0, String::from("0"));
    }
    let price_uint = (total_sushi_token as u128)
        .checked_mul(E9 as u128)
        .unwrap()
        .checked_div(total_xsushi_token as u128)
        .unwrap()
        .try_into()
        .unwrap();
    let price_float = (total_sushi_token as f64) / (total_xsushi_token as f64);

    (price_uint, price_float.to_string())
}


#[derive(Accounts)]
#[instruction(_nonce: u8)]
pub struct Initialize<'info> {
    #[account(
        address = constants::SUSHI_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
    )]
    pub sushi_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = initializer,
        token::mint = sushi_mint,
        token::authority = sushi_vault,
        seeds = [constants::SUSHI_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap().as_ref()],
        bump = _nonce,
    )]
    pub sushi_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub initializer: Signer<'info>,

    ///used by anchor for init of the token
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}

#[derive(Accounts)]
#[instruction(nonce: u8, amount: u64)]
pub struct Stake<'info> {
    // the token user are going to deposite,
    // we use Box<> to make sure that our solana program never run out of Stack frame size which is 4kb, play safe 🦀
    #[account(
        address = constants::SUSHI_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
    )]
    pub sushi_mint: Box<Account<'info, Mint>>,

    // the token user are getting back
    #[account(
        mut,
        address = constants::X_SUSHI_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
    )]
    pub xsushi_mint: Box<Account<'info, Mint>>,

    // user sushi token account to withdraw sushi from
    #[account(mut)] 
    pub user_sushi_token_account: Box<Account<'info, TokenAccount>>,

    // the authority allowed to transfer token from user_sushi_token_account, is obviously user itself
    pub authority: Signer<'info>,

    // token vault, where we'll store, transfered user token
    #[account(
        mut,
        seeds=[ sushi_mint.key().as_ref() ],
        bump = nonce
    )]
    pub sushi_vault: Box<Account<'info, TokenAccount>>,
    
    // user x_sushi_token_account, so that we can send user xsushi_token to the users
    #[account(mut)]
    pub user_xsushi_token_account: Box<Account<'info, TokenAccount>>,

    // misc
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(nonce: u8)]
pub struct Unstake<'info> {
    // the token user are going to deposite,
    // we use Box<> to make sure that our solana program never run out of Stack frame size which is 4kb, play safe 🦀
    #[account(
        address = constants::SUSHI_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
    )]
    pub sushi_mint: Box<Account<'info, Mint>>,

    // the token user are getting back
    #[account(
        address = constants::X_SUSHI_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
    )]
    pub xsushi_mint: Box<Account<'info, Mint>>,

    // user sushi token account to withdraw sushi from
    #[account(mut)] 
    pub user_sushi_token_account: Box<Account<'info, TokenAccount>>,

    // token vault, where we'll store, transfered user token
    #[account(
        mut,
        seeds=[ sushi_mint.key().as_ref() ],
        bump = nonce
    )]
    pub sushi_vault: Box<Account<'info, TokenAccount>>,

    // the authority allowed to transfer token from user_sushi_token_account, is obviously user itself
    pub authority: Signer<'info>,

    // user x_sushi_token_account, so that we can send user xsushi_token to the users
    #[account(mut)]
    pub user_xsushi_token_account: Box<Account<'info, TokenAccount>>,

    // misc
    pub token_program: Program<'info, Token>,

}


#[event]
pub struct PriceChange {
    pub old_sushi_per_xushi_e9: u64,
    pub old_sushi_per_xsushi: String,
    pub new_sushi_per_xsushi_e9: u64,
    pub new_sushi_per_xsushi: String,
}