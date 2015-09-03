module Tesp {
    /** 2-dimensional floating point vector */
    export class Vec2 {
        constructor(public x: number, public y: number) { }

        /** Calculate the euclidean distance between this vector and another */
        distance(other: Vec2): number {
            return Math.sqrt(((other.x - this.x) * (other.x - this.x)) + ((other.y - this.y) * (other.y - this.y)));
        }

        /** Calculate the top-left corner of a cell as a position vector */
        static fromCell(x: number, y: number): Vec2 {
            return new Vec2(x * Cell.width + Cell.widthOffset, y * Cell.height + Cell.heightOffset);
        }
    }

    /** A single significant point in the world */
    export class Node {
        /** Globally unique identifier for this node */
        id: number;
        /** The id of a node this node was created on */
        referenceId: number;
        edges: Edge[];

        private static identity: number = 1;
        constructor(public name: string, public longName: string, public pos: Vec2, public type: string, public permanent: boolean = false) {
            this.id = Node.identity++;
            this.edges = [];
        }
    }

    /** A link between two nodes */
    export class Edge {
        constructor(public srcNode: Node, public destNode: Node, public cost: number) { }
    }

    /** A large area in the world */
    export class Cell {
        static width: number = 44.5;
        static height: number = 44.6;
        static widthOffset: number = 20;
        static heightOffset: number = 35;
        static fromPosition(pos: Vec2): Vec2 {
            return new Vec2((pos.x - Cell.widthOffset) / Cell.width, (pos.y - Cell.heightOffset) / Cell.height);
        }
    }
    /** A single row of cells */
    export class CellRow {
        width: number;

        constructor(public y: number, public x1: number, public x2: number) {
            this.width = x2 - x1 + 1;
        }
    }
    /** An area of one or more cells */
    export class Area {
        private minY: number;
        private maxY: number;

        constructor(public target: Node, public rows: CellRow[]) {
            this.minY = rows[0].y;
            this.maxY = rows[rows.length - 1].y;
        }

        /** Check if this cell contains the supplied coordinates */
        containsCell(pos: Vec2): boolean {
            if (pos.y >= this.minY && pos.y < this.maxY + 1) {
                var row = this.rows[Math.floor(pos.y) - this.minY];
                return pos.x >= row.x1 && pos.x < row.x2 + 1;
            }
            return false;
        }
    }
}