// thaw-genetic/src/interfaces/igenetic-algorithm-result.ts

import { IChromosome } from './ichromosome';

export interface IGeneticAlgorithmResult<T extends IChromosome> {
	readonly datetime: Date;
	readonly generationNumber: number;
	readonly bestChromosome: T;
}
