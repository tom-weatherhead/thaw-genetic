// thaw-genetic/src/interfaces/imutation-operator.ts

import { IChromosome } from './ichromosome';

export interface IMutationOperator<T extends IChromosome> {
	mutate(chromosome: T): T;
}
