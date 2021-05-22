// thaw-genetic/src/interfaces/icrossover-operator.ts

import { IChromosome } from './ichromosome';

export interface ICrossoverOperator<T extends IChromosome> {
	crossover(a: T, b: T): T;
}
