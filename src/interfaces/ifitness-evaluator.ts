// thaw-genetic/src/interfaces/ifitness-evaluator.ts

import { IChromosome } from './ichromosome';

export interface IFitnessEvaluator<T extends IChromosome> {
	evaluateFitness(chromosome: T): Promise<number>;
}
