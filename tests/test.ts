import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { AnchorTicTacToe } from "../target/types/anchor_tic_tac_toe";
import { expect } from "chai";

describe("anchor_tic_tac_toe", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.AnchorTicTacToe as Program<AnchorTicTacToe>;
  const programProvider = program.provider as anchor.AnchorProvider;

  it("Is initialized!", async () => {
    // Add your test here.

    const gameKeypair = anchor.web3.Keypair.generate();
    let first_player = programProvider.wallet;
    let second_player = anchor.web3.Keypair.generate();

    const tx = await program.methods
      .setupGame(second_player.publicKey)
      .accounts({
        game: gameKeypair.publicKey,
        playerOne: first_player.publicKey,
      })
      .signers([gameKeypair])
      .rpc();
    // console.log("Your transaction signature", tx);

    const game_state = await program.account.game.fetch(gameKeypair.publicKey);

    expect(game_state.turn).to.equal(1);
    expect(game_state.players[0]).to.eql(first_player.publicKey);
    expect(game_state.players[1]).to.eql(second_player.publicKey);
    expect(game_state.state).to.eql({ active: {} });
    expect(game_state.board).to.eql([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);
  });

  it("First player win!", async () => {
    // Add your test here.

    const gameKeypair = anchor.web3.Keypair.generate();
    let first_player = programProvider.wallet;
    let second_player = anchor.web3.Keypair.generate();
    let turn_count = 1;

    const tx = await program.methods
      .setupGame(second_player.publicKey)
      .accounts({
        game: gameKeypair.publicKey,
        playerOne: first_player.publicKey,
      })
      .signers([gameKeypair])
      .rpc();
    // console.log("Your transaction signature", tx);

    const game_state = await program.account.game.fetch(gameKeypair.publicKey);

    expect(game_state.turn).to.equal(1);
    expect(game_state.players[0]).to.eql(first_player.publicKey);
    expect(game_state.players[1]).to.eql(second_player.publicKey);
    expect(game_state.state).to.eql({ active: {} });
    expect(game_state.state).to.not.eql({ won: {} });
    expect(game_state.board).to.eql([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);

    turn_count++;
    await program.methods
      .play({ row: 0, column: 0 })
      .accounts({
        game: gameKeypair.publicKey,
        signer: first_player.publicKey,
      })
      .rpc();

    turn_count++;
    await program.methods
      .play({ row: 1, column: 2 })
      .accounts({
        game: gameKeypair.publicKey,
        signer: second_player.publicKey,
      })
      .signers([second_player])
      .rpc();

    turn_count++;
    await program.methods
      .play({ row: 2, column: 2 })
      .accounts({
        game: gameKeypair.publicKey,
        signer: first_player.publicKey,
      })
      .rpc();

    const game_state01 = await program.account.game.fetch(
      gameKeypair.publicKey
    );

    // console.log(game_state01.board);
    expect(game_state01.turn).to.equal(turn_count);

    try {
      await program.methods
        .play({ row: 2, column: 2 })
        .accounts({
          game: gameKeypair.publicKey,
          signer: second_player.publicKey,
        })
        .signers([second_player])
        .rpc();
    } catch (_err) {
      expect(_err).to.be.instanceOf(AnchorError);
      const err: AnchorError = _err;
      expect(err.error.errorCode.code).to.equal("TileAlreadySet");
    }

    try {
      await program.methods
        .play({ row: 3, column: 3 })
        .accounts({
          game: gameKeypair.publicKey,
          signer: second_player.publicKey,
        })
        .signers([second_player])
        .rpc();
    } catch (_err) {
      expect(_err).to.be.instanceOf(AnchorError);
      const err: AnchorError = _err;
      expect(err.error.errorCode.code).to.equal("TileOutOfBounds");
    }

    await program.methods
      .play({ row: 0, column: 1 })
      .accounts({
        game: gameKeypair.publicKey,
        signer: second_player.publicKey,
      })
      .signers([second_player])
      .rpc();

    await program.methods
      .play({ row: 1, column: 1 })
      .accounts({
        game: gameKeypair.publicKey,
        signer: first_player.publicKey,
      })
      .rpc();

    const game_state001 = await program.account.game.fetch(
      gameKeypair.publicKey
    );

    expect(game_state001.state).to.eql({
      won: { winner: first_player.publicKey },
    });
  });

  it("Two players play to tie!", async () => {
    // Add your test here.

    const gameKeypair = anchor.web3.Keypair.generate();
    let first_player = programProvider.wallet;
    let second_player = anchor.web3.Keypair.generate();
    let turn_count = 1;

    const tx = await program.methods
      .setupGame(second_player.publicKey)
      .accounts({
        game: gameKeypair.publicKey,
        playerOne: first_player.publicKey,
      })
      .signers([gameKeypair])
      .rpc();

    const game_state = await program.account.game.fetch(gameKeypair.publicKey);

    expect(game_state.turn).to.equal(1);
    expect(game_state.players[0]).to.eql(first_player.publicKey);
    expect(game_state.players[1]).to.eql(second_player.publicKey);
    expect(game_state.state).to.eql({ active: {} });
    expect(game_state.state).to.not.eql({ won: {} });
    expect(game_state.board).to.eql([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);

    await program.methods
      .play({ row: 0, column: 0 })
      .accounts({
        game: gameKeypair.publicKey,
        signer: first_player.publicKey,
      })
      .rpc();

    turn_count++;
    await program.methods
      .play({ row: 1, column: 0 })
      .accounts({
        game: gameKeypair.publicKey,
        signer: second_player.publicKey,
      })
      .signers([second_player])
      .rpc();

    await program.methods
      .play({ row: 0, column: 1 })
      .accounts({
        game: gameKeypair.publicKey,
        signer: first_player.publicKey,
      })
      .rpc();

    turn_count++;
    await program.methods
      .play({ row: 1, column: 1 })
      .accounts({
        game: gameKeypair.publicKey,
        signer: second_player.publicKey,
      })
      .signers([second_player])
      .rpc();

    turn_count++;
    await program.methods
      .play({ row: 1, column: 2 })
      .accounts({
        game: gameKeypair.publicKey,
        signer: first_player.publicKey,
      })
      .rpc();

    await program.methods
      .play({ row: 0, column: 2 })
      .accounts({
        game: gameKeypair.publicKey,
        signer: second_player.publicKey,
      })
      .signers([second_player])
      .rpc();

    turn_count++;
    await program.methods
      .play({ row: 2, column: 0 })
      .accounts({
        game: gameKeypair.publicKey,
        signer: first_player.publicKey,
      })
      .rpc();

    await program.methods
      .play({ row: 2, column: 1 })
      .accounts({
        game: gameKeypair.publicKey,
        signer: second_player.publicKey,
      })
      .signers([second_player])
      .rpc();

    await program.methods
      .play({ row: 2, column: 2 })
      .accounts({
        game: gameKeypair.publicKey,
        signer: first_player.publicKey,
      })
      .rpc();

    const game_state01 = await program.account.game.fetch(
      gameKeypair.publicKey
    );

    // console.log("game_state01.turn    :", game_state01.turn);
    // console.log("turn_count           :", turn_count);
    // console.log("game_state01.state   :", game_state01.state);

    // console.log(game_state01.board);
    // expect(game_state01.state).to.equal(turn_count);
    expect(game_state01.state).to.eql({ tie: {} });
  });
});
