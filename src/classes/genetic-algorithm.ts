// thaw-genetic/src/classes/genetic-algorithm.ts

import { Observable, Subscriber } from 'rxjs';

import { getIntervalStringFromMilliseconds } from 'thaw-common-utilities.ts';

import { IGeneticAlgorithm } from '../interfaces/igenetic-algorithm';

import { IGeneticAlgorithmOptions } from '../interfaces/igenetic-algorithm-options';

import { IGeneticAlgorithmResult } from '../interfaces/igenetic-algorithm-result';

import { IChromosome, IChromosomeFactory } from '../interfaces/ichromosome';

import { ICrossoverOperator } from '../interfaces/icrossover-operator';
import { IMutationOperator } from '../interfaces/imutation-operator';
import { IFitnessEvaluator } from '../interfaces/ifitness-evaluator';

class GeneticAlgorithm<T extends IChromosome> implements IGeneticAlgorithm<T> {
	// Generic algorithm parameters:
	private readonly maxGeneration: number;
	private readonly initialPopulationSize: number;
	private readonly maxPopulationSize: number;
	private readonly numBreedingsPerGeneration: number;
	private readonly numMutationsPerGeneration: number;
	private readonly goalStateThreshold: number;
	private readonly stopIfNoNewBestInNGenerations: number;

	private readonly fnDisplayMessage: (message: string) => void;

	private population: T[] = [];
	private discardedPopulation: T[] = [];
	private fitnessWeightsArray: number[] = [];
	private consensusFitnessArray: number[] = [];
	private consensusGenerationArray: number[] = [];
	private bestFitness = NaN;
	private generationWhenBestFitnessWasFirstSeen = 0;

	constructor(
		private readonly preloadData: () => Promise<number>,
		private readonly chromosomeFactory: IChromosomeFactory<T>,
		private readonly crossoverOperator: ICrossoverOperator<T>,
		private readonly mutationOperator: IMutationOperator<T>,
		private readonly fitnessEvaluator: IFitnessEvaluator<T>,
		options: IGeneticAlgorithmOptions
	) {
		this.fnDisplayMessage = options.fnDisplayMessage;
		this.maxGeneration = options.maxGeneration;
		this.initialPopulationSize = options.initialPopulationSize;
		this.maxPopulationSize = options.maxPopulationSize;
		this.numBreedingsPerGeneration = options.numBreedingsPerGeneration;
		this.numMutationsPerGeneration = options.numMutationsPerGeneration;
		this.goalStateThreshold = options.goalStateThreshold;
		this.stopIfNoNewBestInNGenerations =
			options.stopIfNoNewBestInNGenerations;

		// this.crossoverOperator = crossoverOperator;
		// this.mutationOperator = mutationOperator;
	}

	public run(): Observable<IGeneticAlgorithmResult<T>> {
		this.population = this.chromosomeFactory.createSeedChromosomes();
		this.discardedPopulation = [];
		this.consensusFitnessArray = [];
		this.consensusGenerationArray = [];

		while (this.population.length < this.initialPopulationSize) {
			this.addChromosomeToPopulation(
				this.chromosomeFactory.createRandomChromosome()
			);
		}

		return new Observable(
			(subscriber: Subscriber<IGeneticAlgorithmResult<T>>) => {
				// Observer<>/Subscriber<> has methods: closed?(), complete(), error(), next().

				const startRunDateTime = new Date();

				this.preloadData()
					.then((numCandlesticksPreloaded) => {
						this.fnDisplayMessage(
							`${numCandlesticksPreloaded} candlestick(s) preloaded.`
						);

						const dataPreloadedDateTime = new Date();
						const msDelay = 10;
						const fn = (generationNumber: number) => {
							if (subscriber.closed) {
								subscriber.complete();

								return;
							}

							console.log(
								`Generation ${generationNumber} : evaluateFitnessOfNewChromosomes()`
							);

							this.evaluateFitnessOfNewChromosomes()
								.then(() => {
									const bestChromosome =
										this.findBestChromosome();

									// BEGIN Fitness values are non-NaN and sorted

									let kkk;

									for (
										kkk = 0;
										kkk < this.population.length - 1;
										kkk++
									) {
										if (
											this.population[kkk + 1].fitness !==
											this.population[0].fitness
										) {
											break;
										}
									}

									while (
										this.consensusFitnessArray.length <= kkk
									) {
										this.consensusFitnessArray.push(
											this.population[0].fitness
										);
										this.consensusGenerationArray.push(
											generationNumber
										);
									}

									// bestChromosome.toString()
									this.fnDisplayMessage(
										`Gen ${generationNumber}: best fitness is ${
											bestChromosome.fitness
										}; fitness range is
											${bestChromosome.fitness - this.population[this.population.length - 1].fitness}`
									);

									let doExit = false;

									if (
										Number.isNaN(this.bestFitness) ||
										this.bestFitness <
											bestChromosome.fitness
									) {
										this.bestFitness =
											bestChromosome.fitness;
										this.generationWhenBestFitnessWasFirstSeen =
											generationNumber;
									}

									if (
										this
											.generationWhenBestFitnessWasFirstSeen +
											this.stopIfNoNewBestInNGenerations <
										generationNumber
									) {
										console.log(
											`\nEarly exit: No new best solution in ${this.stopIfNoNewBestInNGenerations} generations.\n`
										);
										doExit = true;
									} else if (
										this.isInGoalState(bestChromosome)
									) {
										console.log('\n**** Goal State ****\n');
										doExit = true;
									} else if (
										this.maxGeneration > 0 &&
										generationNumber >= this.maxGeneration
									) {
										console.log(
											'\nGeneration limit reached.\n'
										);
										doExit = true;
									}

									subscriber.next({
										datetime: new Date(),
										generationNumber,
										bestChromosome
									});

									// this.selection(); // Remove poor performers from the population
									this.truncateAndReIndex();

									// END Fitness values are non-NaN and sorted

									if (doExit) {
										const endRunDateTime = new Date();
										let i;

										console.log('\nFinal population:\n');

										for (
											i = 0;
											i < this.population.length;
											i++
										) {
											console.log(
												`Chromosome ${i}:`,
												this.population[i]
											);
										}

										for (
											i = 0;
											i <
											this.consensusFitnessArray.length;
											i++
										) {
											console.log(
												`Consensus: i ${i}, gen ${this.consensusGenerationArray[i]}, fitness ${this.consensusFitnessArray[i]}`
											);
										}

										console.log(
											'\nData preloaded in:',
											getIntervalStringFromMilliseconds(
												dataPreloadedDateTime.valueOf() -
													startRunDateTime.valueOf()
											)
										);
										console.log(
											'Algorithm running time:',
											getIntervalStringFromMilliseconds(
												endRunDateTime.valueOf() -
													dataPreloadedDateTime.valueOf()
											)
										);

										// TODO? : POST the parameters and
										// results to the Web service so they
										// can be written to a JSON log file?
										// or inserted into the database?

										subscriber.complete();

										return;
									}

									this.crossover(); // Create new chromosomes by breeding
									this.mutation(); // Mutate a few of the new chromosomes

									setTimeout(
										() => fn(generationNumber + 1),
										msDelay
									);
								})
								.catch((error) => subscriber.error(error));
						};

						fn(1);
					})
					.catch((error) => subscriber.error(error));
			}
		);
	}

	private arrayContainsChromosome(a: T[], c: T): boolean {
		return a.find((cc) => c.isEqualTo(cc)) !== undefined;
	}

	private addChromosomeToPopulation(c: T): boolean {
		if (
			this.arrayContainsChromosome(
				this.population.concat(this.discardedPopulation),
				c
			)
		) {
			return false;
		}

		this.population.push(c);

		return true;
	}

	private getRandomChromosomeIndex(): number {
		const fitnessSum =
			this.fitnessWeightsArray[this.fitnessWeightsArray.length - 1];
		const random = Math.random() * fitnessSum;
		let i;

		for (i = 0; i < this.fitnessWeightsArray.length; i++) {
			if (random < this.fitnessWeightsArray[i]) {
				break;
			}
		}

		if (i >= this.fitnessWeightsArray.length) {
			throw new Error(
				'getRandomChromosomeIndex() : Ran off the end of the fitnessWeightsArray'
			);
		}

		if (i < 0 || i >= this.population.length) {
			throw new Error(
				`getRandomChromosomeIndex() : Index is ${i}; population length is ${this.population.length}`
			);
		}

		return i;
	}

	private truncateAndReIndex(): void {
		// Truncate
		this.discardedPopulation = this.discardedPopulation.concat(
			this.population.slice(this.maxPopulationSize)
		);
		this.population = this.population.slice(0, this.maxPopulationSize);

		// Re-index
		this.fitnessWeightsArray = new Array(this.population.length).fill(0);

		for (let i = 0; i < this.population.length; i++) {
			const n = this.population.length - i;

			this.fitnessWeightsArray[i] = n * n;
		}

		for (let i = 1; i < this.population.length; i++) {
			this.fitnessWeightsArray[i] += this.fitnessWeightsArray[i - 1];
		}
	}

	private crossover(): void {
		let i = 0;
		const goalPopulationSize =
			this.population.length + this.numBreedingsPerGeneration;

		while (this.population.length < goalPopulationSize) {
			if (++i > 3 * this.numBreedingsPerGeneration) {
				break;
			}

			const n1 = this.getRandomChromosomeIndex();
			let n2;

			do {
				n2 = this.getRandomChromosomeIndex();
			} while (n2 === n1);

			const c1 = this.population[n1];
			const c2 = this.population[n2];

			this.addChromosomeToPopulation(
				this.crossoverOperator.crossover(c1, c2)
			);
		}
	}

	private mutation(): void {
		let i = 0;
		const goalPopulationSize =
			this.population.length + this.numMutationsPerGeneration;

		while (this.population.length < goalPopulationSize) {
			if (++i > 3 * this.numMutationsPerGeneration) {
				break;
			}

			const n1 = this.getRandomChromosomeIndex();
			const c1 = this.population[n1];

			this.addChromosomeToPopulation(this.mutationOperator.mutate(c1));
		}
	}

	private async evaluateFitnessOfNewChromosomes(): Promise<void> {
		const newChromosomes = this.population.filter((c) =>
			Number.isNaN(c.fitness)
		);

		// for (const c of newChromosomes) {
		for (let i = 0; i < newChromosomes.length; i++) {
			const c = newChromosomes[i];

			console.log(
				`Evaluating fitness of new chromosome ${i + 1} of ${
					newChromosomes.length
				}...`
			);
			await this.fitnessEvaluator.evaluateFitness(c);
		}
	}

	private findBestChromosome(): T {
		this.population.sort((a, b) => b.fitness - a.fitness);

		return this.population[0];
	}

	private isInGoalState(bestChromosome: T): boolean {
		const n = (
			this.population.filter(
				(c) => c.fitness === bestChromosome.fitness
			) || []
		).length;

		if (n > 1) {
			console.log(`The top ${n} chromosomes have the same fitness.`);
		}

		return n >= (9 * this.maxPopulationSize) / 10;
	}
}

export function createGeneticAlgorithm<T extends IChromosome>(
	preloadData: () => Promise<number>,
	chromosomeFactory: IChromosomeFactory<T>,
	crossoverOperator: ICrossoverOperator<T>,
	mutationOperator: IMutationOperator<T>,
	fitnessEvaluator: IFitnessEvaluator<T>,
	options: IGeneticAlgorithmOptions
): IGeneticAlgorithm<T> {
	return new GeneticAlgorithm<T>(
		preloadData,
		chromosomeFactory,
		crossoverOperator,
		mutationOperator,
		fitnessEvaluator,
		options
	);
}
