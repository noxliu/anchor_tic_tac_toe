use anchor_lang::prelude::*;
use num_derive::*;
use num_traits::*;
declare_id!("8HihNokjX2nFDPktFWh7oWN3Bzq9QTeqCE3L4t4gu8EQ");

pub const MAXIMUM_SIZE: usize = (32 * 2) + 1 + (12 * (1 + 1)) + (32 + 1);

#[program]
pub mod anchortictactoe_1113 {

    use anchor_lang::{context, solana_program::nonce::State};

    use super::*;

    pub fn setup_game(ctx: Context<SetupGame>, player_two: Pubkey) -> Result<()> {
        ctx.accounts.game.players = [ctx.accounts.player_one.key(), player_two];
        ctx.accounts.game.turn = 1;
        Ok(())
    }

    pub fn play(ctx: Context<Play>, tile: Tile) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.game.current_player(),
            ctx.accounts.signer.key(),
            TicTacToeErrors::NotPlayersTurn
        );
        match tile {
            tile @ Tile {
                row: 0..=2,
                column: 0..=2,
            } => match ctx.accounts.game.board[tile.row as usize][tile.column as usize] {
                Some(_) => return Err(TicTacToeErrors::TileAlreadySet.into()),
                None => {
                    ctx.accounts.game.board[tile.row as usize][tile.column as usize] = Some(
                        // Sign::from_usize(((ctx.accounts.game.turn - 1) % 2).to_usize().unwrap())
                        //     .unwrap(),
                        Sign::from_usize(ctx.accounts.game.current_player_index()).unwrap(),
                    )
                }
            },
            _ => return Err(TicTacToeErrors::TileOutOfBounds.into()),
        }

        // ctx.accounts.game.turn += 1;
        // check if current player win, three of the same in one row
        for i in 0..=2 {
            if check_if_win(ctx.accounts.game.board, [(i, 0), (i, 1), (i, 2)]) {
                ctx.accounts.game.state = GameState::Won {
                    winner: ctx.accounts.game.current_player(),
                };
                break;
            };
        }

        // check if current player win, three of the same in one column
        for i in 0..=2 {
            if check_if_win(ctx.accounts.game.board, [(0, i), (1, i), (2, i)]) {
                ctx.accounts.game.state = GameState::Won {
                    winner: ctx.accounts.game.current_player(),
                };
                break;
            };
        }

        if check_if_win(ctx.accounts.game.board, [(0, 0), (1, 1), (2, 2)]) {
            ctx.accounts.game.state = GameState::Won {
                winner: ctx.accounts.game.current_player(),
            };
        };

        if check_if_win(ctx.accounts.game.board, [(0, 2), (1, 1), (2, 0)]) {
            ctx.accounts.game.state = GameState::Won {
                winner: ctx.accounts.game.current_player(),
            };
        };

        // let mut game_is_finish: bool = true;

        // for row in 0..=2 {
        //     for column in 0..=2 {
        //         if ctx.accounts.game.board[row][column].is_none() {
        //             game_is_finish = false;
        //         }
        //     }
        // }

        if GameState::Active == ctx.accounts.game.state {
            ctx.accounts.game.turn += 1;
        }

        if ctx.accounts.game.turn == 9 {
            ctx.accounts.game.state = GameState::Tie;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct SetupGame<'info> {
    #[account(init, payer = player_one, space = MAXIMUM_SIZE + 8)]
    pub game: Account<'info, Game>,

    #[account(mut)]
    pub player_one: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn check_if_win(board: [[Option<Sign>; 3]; 3], trio: [(usize, usize); 3]) -> bool {
    let [first, second, third] = trio;
    board[first.0][first.1].is_some()
        && board[first.0][first.1] == board[second.0][second.1]
        && board[first.0][first.1] == board[third.0][third.1]
}

// #[derive(Accounts)]
// pub struct Game<'info> {}

#[derive(Accounts)]
pub struct Play<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    pub signer: Signer<'info>,
}

#[account]
pub struct Game {
    players: [Pubkey; 2],
    turn: u8,
    board: [[Option<Sign>; 3]; 3],
    state: GameState,
}

impl Game {
    fn current_player_index(&self) -> usize {
        ((self.turn - 1) % 2) as usize
    }

    pub fn current_player(&self) -> Pubkey {
        self.players[self.current_player_index()]
    }
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, PartialEq)]
pub enum GameState {
    Active,
    Tie,
    Won { winner: Pubkey },
}

#[derive(
    AnchorDeserialize, AnchorSerialize, Clone, PartialEq, Copy, FromPrimitive,
)]
pub enum Sign {
    X,
    O,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct Tile {
    row: u8,
    column: u8,
}

#[error_code]
pub enum TicTacToeErrors {
    TileOutOfBounds,
    TileAlreadySet,
    GameAlreadyOver,
    NotPlayersTurn,
    GameAlreadyStarted,
}
