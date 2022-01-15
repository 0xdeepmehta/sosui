import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Soshi } from '../target/types/soshi';
const { TOKEN_PROGRAM_ID, Token, MintLayout, AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const fs = require('fs');


describe('soshi', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Soshi as Program<Soshi>;

  // it('Creating Token Sushi Mint', async () => {
  //   // Public/Mint key for sushi token
  //   // const sushiMintPub = new anchor.web3.PublicKey("6zV9gwGAKNa8PBHSed99hrFixCLSSv4Dx9Fqj2QZhjwh");
  //   let rawdata = fs.readFileSync('tests/keys/Sushi-6zV9gwGAKNa8PBHSed99hrFixCLSSv4Dx9Fqj2QZhjwh.json');
  //   let keyData = JSON.parse(rawdata);
  //   const sushiMintPub = anchor.web3.Keypair.fromSecretKey(new Uint8Array(keyData));

  //   // Creating the mint token account for Sushi
  //   let mintSushiTx = new anchor.web3.Transaction().add(
  //     // create a mint account for Predefined-publicKey
  //     anchor.web3.SystemProgram.createAccount({
  //       fromPubkey: program.provider.wallet.publicKey,
  //       newAccountPubkey: sushiMintPub.publicKey,
  //       space: MintLayout.span,
  //       lamports: await Token.getMinBalanceRentForExemptMint(program.provider.connection),
  //       programId: TOKEN_PROGRAM_ID
  //     }),

  //     // initialize mint account with the metadata
  //     Token.createInitMintInstruction(
  //       TOKEN_PROGRAM_ID,
  //       sushiMintPub.publicKey,
  //       8,
  //       program.provider.wallet.publicKey,
  //       null
  //     )
  //   );
  //   console.log(`Create mint account txhash :: ${await program.provider.send(mintSushiTx, [sushiMintPub])}`)
  // });

  // it('Minted xSuhsi and assisgend its authority to PDA', async () => {
  //   const sushiMintPub = new anchor.web3.PublicKey("6zV9gwGAKNa8PBHSed99hrFixCLSSv4Dx9Fqj2QZhjwh");

  //   // program derived address
  //   // It is act as a valut where user store their token
  //   // It also act as a authority of XSUSHI Mint, so that program have authority to mint xSUSHI itself
  //   const [vaultPubkey, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
  //     [sushiMintPub.toBuffer()],
  //     program.programId
  //   );

  //   console.log("vault pubkey :: ", vaultPubkey.toBase58());

  //   let rawdata = fs.readFileSync('tests/keys/xSushi-EJ57o3yQy518DzQM9juQSuStdqZur1fkvPXYjMBNcJZs.json');
  //   let keyData = JSON.parse(rawdata);
  //   const xsushiMintPub = anchor.web3.Keypair.fromSecretKey(new Uint8Array(keyData));

  //   // Creating the mint token account for Sushi
  //   let mintxSushiTx = new anchor.web3.Transaction().add(
  //     // create a mint account for Predefined-publicKey
  //     anchor.web3.SystemProgram.createAccount({
  //       fromPubkey: program.provider.wallet.publicKey,
  //       newAccountPubkey: xsushiMintPub.publicKey,
  //       space: MintLayout.span,
  //       lamports: await Token.getMinBalanceRentForExemptMint(program.provider.connection),
  //       programId: TOKEN_PROGRAM_ID
  //     }),

  //     // initialize mint account with the metadata
  //     Token.createInitMintInstruction(
  //       TOKEN_PROGRAM_ID,
  //       xsushiMintPub.publicKey,
  //       8,
  //       vaultPubkey,
  //       null
  //     )
  //   );
  //   console.log(`Create mint account txhash :: ${await program.provider.send(mintxSushiTx, [xsushiMintPub])}`)

  // });

  it('now doing paddi', async () => {
    const sushiMintPub = new anchor.web3.PublicKey("6zV9gwGAKNa8PBHSed99hrFixCLSSv4Dx9Fqj2QZhjwh");
    const xsushiMintPub = new anchor.web3.PublicKey("EJ57o3yQy518DzQM9juQSuStdqZur1fkvPXYjMBNcJZs");

    const [vaultPubkey, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
      [sushiMintPub.toBuffer()],
      program.programId
    );
    console.log("vault pubkey :: ", vaultPubkey.toBase58());

    const sushiTokenAccountPubkey = new anchor.web3.PublicKey("6eAouEehP36HW7R1GErZnuN727ebcg1uVXFRxLK8U3bZ");

    const xSushiTokenAccountPubkey = new anchor.web3.PublicKey("8tpuMtDuwBUfdVUq9kYbn7hPLat8xnJrazesNsatApqs");

    await program.rpc.stake(
      vaultBump,
      new anchor.BN(5_000_000_000),
      {
        accounts: {
          sushiMint: sushiMintPub,
          xsushiMint: xsushiMintPub,
          userSushiTokenAccount: sushiTokenAccountPubkey,
          authority: program.provider.wallet.publicKey,
          sushiVault: vaultPubkey,
          userXsushiTokenAccount: xSushiTokenAccountPubkey,
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      }
    );

    // let tx = new anchor.web3.Transaction().add(
    //   Token.createMintToInstruction(
    //     TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
    //     sushiMintPub, // mint
    //     sushiTokenAccountPubkey, // receiver (sholud be a token account)
    //     program.provider.wallet.publicKey, // mint authority
    //     [], // only multisig account will use. leave it empty now.
    //     10_000_000_000 // amount. if your decimals is 8, you mint 10^8 for 1 token.
    //   )
    // );

    // console.log(`txhash: ${await program.provider.send(tx)}`);






    // // Initialize the pool
    // const initTx = await program.rpc.initialize(
    //   vaultBump,
    //   {
    //     accounts: {
    //       sushiMint: sushiMintPub,
    //       sushiVault: vaultPubkey,
    //       initializer: program.provider.wallet.publicKey,
    //       systemProgram: anchor.web3.SystemProgram.programId,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //       rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //     }
    //   }
    // );
    // console.log(`Initalize txhash :: ${initTx}`);

    // create associated token account for sushi
    // create ATA
    // let Sata = await Token.getAssociatedTokenAddress(
    //   ASSOCIATED_TOKEN_PROGRAM_ID,
    //   TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
    //   sushiMintPub, // mint
    //   program.provider.wallet.publicKey // owner
    // );
    // console.log(`ATA: ${Sata.toBase58()}`);

    // let userATASUSHItx = new anchor.web3.Transaction().add(
    //   Token.createAssociatedTokenAccountInstruction(
    //     ASSOCIATED_TOKEN_PROGRAM_ID, // always ASSOCIATED_TOKEN_PROGRAM_ID
    //     TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
    //     sushiMintPub, // mint
    //     Sata, // ata
    //     program.provider.wallet.publicKey, // owner of token account
    //     program.provider.wallet.publicKey // fee payer
    //   )
    // );
    // console.log(`txhash: ${await program.provider.send(userATASUSHItx)}`);

    // let xSata = await Token.getAssociatedTokenAddress(
    //   ASSOCIATED_TOKEN_PROGRAM_ID,
    //   TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
    //   xsushiMintPub, // mint
    //   program.provider.wallet.publicKey // owner
    // );
    // console.log(`ATA: ${xSata.toBase58()}`);

    // let userATAXSUSHItx = new anchor.web3.Transaction().add(
    //   Token.createAssociatedTokenAccountInstruction(
    //     ASSOCIATED_TOKEN_PROGRAM_ID, // always ASSOCIATED_TOKEN_PROGRAM_ID
    //     TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
    //     xsushiMintPub, // mint
    //     xSata, // ata
    //     program.provider.wallet.publicKey, // owner of token account
    //     program.provider.wallet.publicKey // fee payer
    //   )
    // );
    // console.log(`txhash: ${await program.provider.send(userATAXSUSHItx)}`);
  });

  // // Let's mint some token
  // let mintSushiTx = new anchor.web3.Transaction().add(
  //   Token.createMintToInstruction(
  //     TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
  //     sushiMintPub, // mint
  //     xSata.to , // receiver (sholud be a token account)
  //     alice.publicKey, // mint authority
  //     [], // only multisig account will use. leave it empty now.
  //     1e8 // amount. if your decimals is 8, you mint 10^8 for 1 token.
  //   )
  // )

  // it('Is initialized!', async () => {
  //   // Create a mint account from predefined key
  //     // generate a new keypair for mint account
  //   const mint = anchor.web3.Keypair.generate();
  //   console.log(`Mint PublicKey: ${mint.publicKey.toBase58()}`);

  //   // transcation
  //   let tx = new anchor.web3.Transaction().add(
  //     // create a new mint account
  //     // It's basically a account, where we store the metadata of the token
  //     anchor.web3.SystemProgram.createAccount({
  //       fromPubkey: program.provider.wallet.publicKey,
  //       newAccountPubkey: mint.publicKey,
  //       space: MintLayout.span,
  //       lamports: await Token.getMinBalanceRentForExemptMint(program.provider.connection),
  //       programId: TOKEN_PROGRAM_ID
  //     }),
  //     // init mint account
  //     Token.createInitMintInstruction(
  //       TOKEN_PROGRAM_ID,
  //       mint.publicKey,
  //       8,
  //       program.provider.wallet.publicKey,
  //       null,
  //     )
  //   );
  //   // console.log(`txhash :: ${await program.provider.send(tx, [mint])}`)


  //   // create Ancillary Token account
  //     // generate a new keypair for token account
  // const tokenAccount = anchor.web3.Keypair.generate();
  // console.log(`token account: ${tokenAccount.publicKey.toBase58()}`);
  // let txA = new anchor.web3.Transaction().add(
  //   // create token account
  //   anchor.web3.SystemProgram.createAccount({
  //     fromPubkey: program.provider.wallet.publicKey,
  //     newAccountPubkey: tokenAccount.publicKey,
  //     space: AccountLayout.span,
  //     lamports: await Token.getMinBalanceRentForExemptAccount(program.provider.connection),
  //     programId: TOKEN_PROGRAM_ID,
  //   }),
  //   // init mint account
  //   Token.createInitAccountInstruction(
  //     TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
  //     mint.publicKey, // mint
  //     tokenAccount.publicKey, // token account
  //     tokenAccount.publicKey // owner of token account
  //   )
  // );
  // // console.log(`txhash :: ${await program.provider.send(txA, [tokenAccount])}`)

  // console.log("Hahaha")
  // const [vaultPubkey, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
  //   [tokenAccount.publicKey.toBuffer()],
  //   program.programId
  // );
  // console.log(`TokenValutPubkey :: ${vaultPubkey} and it's bump key :: ${vaultBump}`)

  // console.log("Hehehe")
  // const [xvaultPubkey, xvaultBump] = await anchor.web3.PublicKey.findProgramAddress(
  //   [tokenAccount.publicKey.toBuffer()],
  //   program.programId
  // );
  // console.log(`TokenValutPubkey :: ${xvaultPubkey} and it's bump key :: ${xvaultBump}`)


  // });
});
