// thaw-genetic/src/interfaces/igenetic-algorithm.ts

import { Observable } from 'rxjs';

import { IChromosome } from './ichromosome';

import { IGeneticAlgorithmResult } from './igenetic-algorithm-result';

export interface IGeneticAlgorithm<T extends IChromosome> {
	run(): Observable<IGeneticAlgorithmResult<T>>;
}
