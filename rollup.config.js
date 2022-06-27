// rollup.config.js

/**
 * Copyright (c) Tom Weatherhead. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in
 * the LICENSE file in the root directory of this source tree.
 */

'use strict';

import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
	input: './dist/types/main.js',
	output: [
		{
			file: 'dist/thaw-genetic.cjs.js',
			format: 'cjs',
			exports: 'named'
		},
		{
			file: 'dist/thaw-genetic.esm.js',
			format: 'es',
			esModule: true,
			compact: true
		} // ,
		// {
		// 	file: 'dist/thaw-genetic.js',
		// 	name: 'thaw-genetic',
		// 	format: 'umd',
		// 	compact: true
		// }
	],
	context: 'this',
	// See https://rollupjs.org/guide/en/#warning-treating-module-as-external-dependency :
	// external: ['rxjs'],
	plugins: [nodeResolve(), terser()]
};
