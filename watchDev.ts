import chokidar from 'chokidar';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

let changeDetected = false;
let commandRunning = false;

// Function to execute a command
const executeCommand = async (command: string): Promise<void> => {
	try {
		const childProcess = exec(command);

		childProcess.stdout?.on('data', (data) => {
			process.stdout.write(data);
		});

		childProcess.stderr?.on('data', (data) => {
			process.stderr.write(data);
		});

		await new Promise<void>((resolve, reject) => {
			childProcess.on('close', (code) => {
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`Command exited with code ${code}`));
				}
			});
		});
	} catch (error) {
		console.error('Error executing command:', error);
	}
};

// Function to handle changes
const handleChange = async (): Promise<void> => {
	if (commandRunning) {
		changeDetected = true;
		return;
	}

	if (changeDetected) {
		commandRunning = true;
		changeDetected = false;

		await executeCommand('npm run dev');
		console.log(`Waiting on new changes.`);

		commandRunning = false;
	}
};

// Initialize chokidar
const watcher = chokidar.watch('src/**/*.*', {
	ignored: /node_modules/,
	persistent: true,
	ignoreInitial: true,
	usePolling: true,
	interval: 100,
	binaryInterval: 300
});

watcher.on('all', (event, path) => {
	console.log(`File ${path} has been ${event}`);
	setTimeout(handleChange, 0);
});

setTimeout(handleChange, 100);
