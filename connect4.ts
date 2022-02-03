import { rejects } from "assert";

const readline = require("readline");

const read_line_interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const width = 7;
const height = 7;

interface GameBoard {
    board: number[][],
    player: 1 | 2,
    computer: boolean
}

interface resType {
    gameboard: GameBoard,
    row: number
}

enum WinningState {
    P1,
    P2,
    STALEMATE,
    CONTINUE
}

// [[top row],[second top row]...]
const prepareBoard = (computer: string): GameBoard => {
    const board: number[][] = [];
    const c = computer === 'y' || computer === 'yes' || computer === 'Y' || computer === 'Yes' ? true : false;
    for (let i = 0; i < height; i++) {
        const row: number[] = [];
        for (let j = 0; j < width; j++) {
            row.push(0);
        }
        board.push(row);
    };
    return {
        board,
        player: 1,
        computer: c
    }
}

// Displays "O" for player1 ; "X" for player2/computer
const printBoard = (gb: GameBoard): void => {
    const gameboard = gb.board;
    console.log('Current Player: ' + gb.player);
    console.log('Computer: ' + gb.computer);
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let symbol;
            gameboard[i][j] === 1 ? symbol = 'O' : gameboard[i][j] === 2 ? symbol = 'X' : symbol = '*';
            process.stdout.write(symbol + ' ');
        }
        console.log('\n');
    };
}

const checkAry = (ary: number[]): number => {
    let maxConsecutive = 0;
    let piece = 0;
    let result = 0;
    ary.map(n => {
        if (n === 0) {
            maxConsecutive = 0;
            piece = 0;
        } else if (n === piece) {
            maxConsecutive++;
            if (maxConsecutive === 4) {
                result = piece;
            }
        } else {
            piece = n;
            maxConsecutive = 1;
        }
    })
    return result;
}

// checks if the board is in winning state / full
const checkBoard = (gb: GameBoard, column: number, row: number): Promise<WinningState> => {
    return new Promise(resolve => {
        const maxRow = row + 3 > height - 1 ? height - 1 : row + 3;
        const minRow = row - 3 < 0 ? 0 : row - 3;
        const maxCol = column + 3 > width - 1 ? width - 1 : column + 3;
        const minCol = column - 3 < 0 ? 0 : column - 3;
        // horizontal check
        const horizontal = checkAry(gb.board[row].slice(minCol, maxCol + 1));
        if (horizontal === 0) {
            // vertical check
            const vAry = gb.board.slice(minRow, maxRow + 1).map(row => row[column]);
            const vertical = checkAry(vAry);
            if (vertical === 0) {
                // left top -> right bottom diagonal check
                const leftBound = -Math.min(column - minCol, row - minRow);
                const rightBound = Math.min(maxCol - column, maxRow - row);
                const descAry = [];
                for (let i = leftBound; i <= rightBound; i++) {
                    descAry.push(gb.board[row + i][column + i]);
                }
                const descending = checkAry(descAry);
                if (descending === 0) {
                    // left bottom -> right top diagonal check
                    const leftBound = -Math.min(column - minCol, maxRow - row);
                    const rightBound = Math.min(maxCol - column, row - minRow);
                    const ascAry = [];
                    for (let i = leftBound; i <= rightBound; i++) {
                        ascAry.push(gb.board[row - i][column + i]);
                    }
                    const ascending = checkAry(ascAry);
                    if (ascending === 0) {
                        // check if board is full
                        for (let i = 0; i < height; i++) {
                            for (let j = 0; j < width; j++) {
                                if (gb.board[i][j] === 0) {
                                    resolve(WinningState.CONTINUE);
                                }
                            }
                        };
                        resolve(WinningState.STALEMATE);
                    } else {
                        ascending === 1 ? resolve(WinningState.P1) : resolve(WinningState.P2);
                    }
                } else {
                    descending === 1 ? resolve(WinningState.P1) : resolve(WinningState.P2);
                }
            } else {
                vertical === 1 ? resolve(WinningState.P1) : resolve(WinningState.P2);
            }
        } else {
            horizontal === 1 ? resolve(WinningState.P1) : resolve(WinningState.P2);
        }
    })
}

const placePiece = (col: number, gameboard: GameBoard): Promise<resType> => {
    return new Promise((resolve, reject) => {
        const gb = gameboard.board;
        for (let i = height - 1; i >= 0; i--) {
            if (gb[i][col] === 0) {
                gb[i][col] = gameboard.player;
                resolve({ gameboard, row: i });
                break;
            }
        }
        reject();
    })
}

const getInput = (gameboard: GameBoard) => {
    if (gameboard.computer && gameboard.player === 2) {
        console.log("computer's move");
        const col = Math.floor(Math.random() * 7);
        placePiece(col, gameboard).then(res => {
            checkBoard(res.gameboard, col, res.row).then(res => {
                if (res === WinningState.CONTINUE) {
                    newRound(gameboard);
                } else {
                    printBoard(gameboard);
                    let winner = 0;
                    winner = res === WinningState.P1 ? 1 : 2;
                    winner === 1 || winner === 2 ? console.log("Player " + winner + " wins!") : console.log("Game over");
                    read_line_interface.question("Continue? ", function (cont) {
                        cont === 'y' ? startGame() : read_line_interface.close();
                    });
                }
            });
        }).catch(err => console.log('Catch block'));
    } else {
        read_line_interface.question("Select a column from 1 to " + width + ": ", function (col) {
            if (col < 1 || col > 7) {
                console.log('Invalid Input');
                getInput(gameboard);
            } else {
                placePiece(col - 1, gameboard).then(res => {
                    checkBoard(res.gameboard, col - 1, res.row).then(res => {
                        if (res === WinningState.CONTINUE) {
                            newRound(gameboard);
                        } else {
                            printBoard(gameboard);
                            let winner = 0;
                            winner = res === WinningState.P1 ? 1 : 2;
                            winner === 1 || winner === 2 ? console.log("Player " + winner + " wins!") : console.log("Game over");
                            read_line_interface.question("Continue? ", function (cont) {
                                cont === 'y' ? startGame() : read_line_interface.close();
                            });
                        }
                    });
                    // newRound(res.gameboard);
                }).catch(err => process.exit(0));
            }
        });
    }
}

const newRound = (gameboard: GameBoard) => {
    gameboard.player === 1 ? gameboard.player = 2 : gameboard.player = 1;
    printBoard(gameboard);
    getInput(gameboard);
}

const startGame = () => {
    read_line_interface.question("Play with computer?", function (computer) {
        const gameboard = prepareBoard(computer);
        printBoard(gameboard);
        getInput(gameboard);
    });
}

startGame();