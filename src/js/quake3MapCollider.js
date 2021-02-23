import { Vector } from "./vector";

const EPSILON = 1.0 / 32.0;

export class Quake3MapCollider {
    constructor(nodes, planes, leafs, leafbrushes, brushes, brushSides, textures) {
        const mInputStart = new Vector();
        const mInputEnd = new Vector();
        const collNormal = new Vector();
        const mCollisionNormal = new Vector();
        let mTraceRadius;
        let mOutputFraction;
        let mGoodPos;
        let mEndDistance;

        this.traceSphere = (start, end, radius) => {
            mTraceRadius = radius;
            mInputStart.copy(start);
            mInputEnd.copy(end);
            let numTries = 0;
            while (numTries < 3) {
                mOutputFraction = 1.0;
                mGoodPos = true;
                checkNode(0, 0.0, 1.0, mInputStart, mInputEnd);
                if (mGoodPos) {
                    return mInputEnd;
                } else {
                    mInputEnd.add(mCollisionNormal.mul(-mEndDistance + EPSILON));
                    numTries++;
                }
            }
            return mInputStart;
        };

        function checkNode(nodeIndex, startFraction, endFraction, start, end) {
            if (nodeIndex < 0) {
                const leaf = leafs[-(nodeIndex + 1)];
                for (let i = 0; i < leaf.numberOfLeafBrushes; i++) {
                    const brush = brushes[leafbrushes[leaf.leafBrush + i]];
                    if (brush.numberOfBrushSides > 0 && (textures[brush.textureIndex].contents & 1) === 1) {
                        checkBrush(brush);
                    }
                }
                return;
            }

            const node = nodes[nodeIndex];
            const plane = planes[node.planeIndex];

            const normal = new Vector().copy(plane);
            const startDX = new Vector().copy(start);
            const endDX = new Vector().copy(end);

            const startDistance = startDX.dot(normal) - plane.w;
            const endDistance = endDX.dot(normal) - plane.w;
            let offset;

            offset = mTraceRadius;

            if (startDistance >= offset && endDistance >= offset) {
                checkNode(node.frontPlaneIndex, startFraction, endFraction, start, end);
            } else if (startDistance < -offset && endDistance < -offset) {
                checkNode(node.backPlaneIndex, startFraction, endFraction, start, end);
            } else {
                let side1, side2, fraction1, fraction2, middleFraction;
                const middle = new Vector();
                let inverseDistance;
                if (startDistance < endDistance) {
                    side1 = node.backPlaneIndex; // back
                    side2 = node.frontPlaneIndex;
                    inverseDistance = 1.0 / (startDistance - endDistance);
                    fraction1 = (startDistance - offset + EPSILON) * inverseDistance;
                    fraction2 = (startDistance + offset + EPSILON) * inverseDistance;
                } else if (endDistance < startDistance) {
                    side1 = node.frontPlaneIndex; // front
                    side2 = node.backPlaneIndex;
                    inverseDistance = 1.0 / (startDistance - endDistance);
                    fraction1 = (startDistance + offset + EPSILON) * inverseDistance;
                    fraction2 = (startDistance - offset - EPSILON) * inverseDistance;
                } else {
                    side1 = node.frontPlaneIndex; // front
                    side2 = node.backPlaneIndex;
                    fraction1 = 1.0;
                    fraction2 = 0.0;
                }

                // make sure the numbers are valid
                if (fraction1 < 0.0) {
                    fraction1 = 0.0;
                } else if (fraction1 > 1.0) {
                    fraction1 = 1.0;
                }
                if (fraction2 < 0.0) {
                    fraction2 = 0.0;
                } else if (fraction2 > 1.0) {
                    fraction2 = 1.0;
                }

                // calculate the middle point for the first side
                middleFraction = startFraction + (endFraction - startFraction) * fraction1;
                middle.copy(end).sub(start).mul(fraction1).add(start);

                // check the first side
                checkNode(side1, startFraction, middleFraction, start, middle);

                // calculate the middle point for the second side
                middleFraction = startFraction + (endFraction - startFraction) * fraction2;
                middle.copy(end).sub(start).mul(fraction2).add(start);

                // check the second side
                checkNode(side2, middleFraction, endFraction, middle, end);
            }
        }

        function checkBrush(brush) {
            let startsOut = false;
            let endsOut = false;
            let startFraction = -1.0;
            let endFraction = 1.0;
            let endDistSaved = 0.0;
            collNormal.set(0.0, 0.0, 0.0, 0.0);

            for (let i = 0; i < brush.numberOfBrushSides; i++) {
                const brushSide = brushSides[brush.brushSide + i];
                const plane = planes[brushSide.planeIndex];
                const startDistance = mInputStart.dot(plane) - (plane.w + mTraceRadius);
                const endDistance = mInputEnd.dot(plane) - (plane.w + mTraceRadius);

                if (startDistance > 0.0) {
                    startsOut = true;
                }
                if (endDistance > 0.0) {
                    endsOut = true;
                }

                if (startDistance > 0.0 && endDistance > 0.0) {
                    return;
                }
                if (startDistance <= 0.0 && endDistance <= 0.0) {
                    continue;
                }

                if (startDistance > endDistance) {
                    const fraction = Math.max(0.0, (startDistance - EPSILON) / (startDistance - endDistance));
                    if (fraction > startFraction) {
                        startFraction = fraction;
                        collNormal.copy(plane);
                        endDistSaved = endDistance;
                    }
                } else {
                    endFraction = Math.min(endFraction, (startDistance + EPSILON) / (startDistance - endDistance));
                }
            }

            if (!startsOut && !endsOut) {
                return;
            }

            if (startFraction < endFraction) {
                if (startFraction > -1.0 && startFraction < mOutputFraction) {
                    mGoodPos = false;
                    mOutputFraction = Math.max(0, startFraction);
                    mCollisionNormal.copy(collNormal);
                    mEndDistance = endDistSaved;
                }
            }
        }
    }
}
