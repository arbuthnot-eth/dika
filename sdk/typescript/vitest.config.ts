// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: BSD-3-Clause-Clear

import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const projectRoot = __dirname;
const systemEnvPath = path.resolve(projectRoot, 'test/system-tests/.env');
const resolvedIkaConfigPath = process.env.IKA_CONFIG_PATH
	? path.resolve(projectRoot, process.env.IKA_CONFIG_PATH)
	: null;
const hasIkaConfig =
	!!resolvedIkaConfigPath && fs.existsSync(resolvedIkaConfigPath)
		? true
		: [
				path.resolve(projectRoot, 'ika_config.json'),
				path.resolve(projectRoot, '../ika_config.json'),
				path.resolve(projectRoot, '../../ika_config.json'),
			].some((candidatePath) => fs.existsSync(candidatePath));
const hasSystemEnv = fs.existsSync(systemEnvPath);

const wantsIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';
const wantsSystem = process.env.RUN_SYSTEM_TESTS === 'true';

const runIntegration = wantsIntegration && hasIkaConfig;
const runSystem = wantsSystem && hasSystemEnv;

if (wantsIntegration && !hasIkaConfig) {
	console.warn(
		'[vitest] RUN_INTEGRATION_TESTS=true ignored: missing ika_config.json (or IKA_CONFIG_PATH).',
	);
}

if (wantsSystem && !hasSystemEnv) {
	console.warn('[vitest] RUN_SYSTEM_TESTS=true ignored: missing test/system-tests/.env.');
}

const exclude = ['**/node_modules/**', '**/chaos-test/**', '**/multiple-network-keys/**'];

if (!runIntegration) {
	exclude.push('**/test/v2/**', '**/test/ika-client/**');
}

if (!runSystem) {
	exclude.push('**/test/system-tests/**', '**/test/move-upgrade/**');
}

export default defineConfig({
	test: {
		minWorkers: 1,
		maxWorkers: 50,
		hookTimeout: 1000000,
		testTimeout: 6_000_000, // 60 minutes
		retry: 0,
		pool: 'forks', // Use forks instead of threads for better memory isolation
		env: {
			NODE_ENV: 'test',
		},
		exclude,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'json', 'lcov'],
			reportsDirectory: './coverage',
			exclude: [
				'**/node_modules/**',
				'**/dist/**',
				'**/*.config.*',
				'**/test/**',
				'**/tests/**',
				'**/*.test.*',
				'**/*.spec.*',
				'**/generated/**',
				'**/src/tx/coordinator.ts',
				'**/src/tx/system.ts',
			],
			include: ['src/**/*.ts', 'src/**/*.js'],
			thresholds: {
				global: {
					branches: 50,
					functions: 50,
					lines: 50,
					statements: 50,
				},
			},
		},
	},
});
