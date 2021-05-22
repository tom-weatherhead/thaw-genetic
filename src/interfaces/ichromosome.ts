// thaw-genetic/src/interfaces/ichromosome.ts

export interface IChromosome {
	fitness: number;

	toString(): string;
	/* eslint-disable @typescript-eslint/no-explicit-any */
	compareFitness(other: any): number;
	isEqualTo(other: any): boolean;
	/* eslint-enable @typescript-eslint/no-explicit-any */
}

export interface IChromosomeFactory<T extends IChromosome> {
	createSeedChromosomes(): T[];
	createRandomChromosome(): T;
}
