import { useMemo } from "react";

/**
 * Genera una matriz visual estilo QR determinística (21x21, versión 1)
 * a partir del código de verificación (CUP-XXXXXX) con patrones de búsqueda
 * reales en las 3 esquinas y módulos de sincronización.
 */
function buildQrMatrix(code: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        const onBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const inCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const inFrame = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        grid[rr][cc] = inFrame && (onBorder || inCenter);
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Líneas de sincronización (fila 6 y columna 6)
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Semilla hash FNV-1a a partir del código
  let hash = 2166136261;
  for (let i = 0; i < code.length; i++) {
    hash ^= code.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (hash >>> 3) % 3 !== 0;
    }
  }

  return grid;
}

interface VerificationQrPassProps {
  verificationCode: string;
  size?: number;
}

export default function VerificationQrPass({
  verificationCode,
  size = 84,
}: VerificationQrPassProps) {
  const matrix = useMemo(() => buildQrMatrix(verificationCode), [verificationCode]);
  const n = matrix.length;

  return (
    <div
      className="bg-white p-2 rounded-button border border-surface-border shadow-subtle inline-flex items-center justify-center shrink-0"
      title={`Pase QR: ${verificationCode}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${n} ${n}`}
        shapeRendering="crispEdges"
        aria-label={`Código QR para ${verificationCode}`}
      >
        {matrix.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#1C1917" />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
