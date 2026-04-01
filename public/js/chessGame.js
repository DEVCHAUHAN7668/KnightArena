

const socket = io(); //  localhost auto le lega
const chess = new Chess();
const boardElement = document.querySelector("#board");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

//  Unicode pieces
const getPieceUnicode = (piece) => {
  const map = {
    p: "♙",
    r: "♖",
    n: "♘",
    b: "♗",
    q: "♕",
    k: "♔"
  };

  return piece.color === "w"
    ? map[piece.type]
    : map[piece.type].replace("♙","♟")
                     .replace("♖","♜")
                     .replace("♘","♞")
                     .replace("♗","♝")
                     .replace("♕","♛")
                     .replace("♔","♚");
};

//  Render Board
const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      const squareElement = document.createElement("div");

      squareElement.classList.add(
        "square",
        (rowIndex + colIndex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = colIndex;

      //  Add piece
      if (square) {
        const pieceElement = document.createElement("div");

        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );

        pieceElement.innerText = getPieceUnicode(square);

        // only allow own move
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (!pieceElement.draggable) return;

          draggedPiece = pieceElement;
          sourceSquare = { row: rowIndex, col: colIndex };

          e.dataTransfer.setData("text/plain", "");
        });

        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      // drag over
      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      // drop
      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();

        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };

          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });
};

// Convert row/col → chess notation (a1, e4)
const toChessNotation = (square) => {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  return files[square.col] + (8 - square.row);
};

// Handle Move
const handleMove = (source, target) => {
  const move = {
    from: toChessNotation(source),
    to: toChessNotation(target),
    promotion: "q",
  };

  socket.emit("move", move);
};

// Socket Events
socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

socket.on("invalidMove", () => {
  renderBoard();
  alert("Invalid Move");
});

//  Initial render
renderBoard();