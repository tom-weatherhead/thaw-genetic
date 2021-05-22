// thaw-genetic/src/interfaces/igenetic-algorithm-options.ts

export interface IGeneticAlgorithmOptions {
	readonly isTest: boolean; // = false;
	readonly maxGeneration: number; // = 40;
	readonly initialPopulationSize: number; // = 20;
	readonly maxPopulationSize: number; // = 30;
	readonly numBreedingsPerGeneration: number; // = 10;
	readonly numMutationsPerGeneration: number; // = 3;
	readonly goalStateThreshold: number; // = 0.05;
	readonly stopIfNoNewBestInNGenerations: number; // = 20;
	readonly fnDisplayMessage: (message: string) => void;
}
