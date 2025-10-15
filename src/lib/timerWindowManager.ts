// src/lib/timerWindowManager.ts
import { Task } from '@/types/taskTypes';

// Extend Window interface to include documentPictureInPicture
declare global {
    interface Window {
        documentPictureInPicture?: {
            requestWindow: (options: { width: number; height: number }) => Promise<Window>;
            window: Window | null;
        };
    }
}

export class TimerWindowManager {
    private pipWindow: Window | null = null;
    private timerInterval: NodeJS.Timeout | null = null;
    private onCompleteCallback: (taskId: string, actualTime: number) => void;
    private onStateChangeCallback: (taskId: string, remainingTime: number, isPaused: boolean) => void;
    private currentTaskId: string | null = null;

    constructor(
        onComplete: (taskId: string, actualTime: number) => void,
        onStateChange: (taskId: string, remainingTime: number, isPaused: boolean) => void
    ) {
        this.onCompleteCallback = onComplete;
        this.onStateChangeCallback = onStateChange;
    }

    async openTimer(task: Task): Promise<void> {
        // If timer is already running for this task, don't open another
        if (this.currentTaskId === task.id && this.pipWindow && !this.pipWindow.closed) {
            this.pipWindow.focus();
            return;
        }

        // Clean up any existing timer
        this.cleanup();

        this.currentTaskId = task.id;

        // Check if Document Picture-in-Picture is supported
        if ('documentPictureInPicture' in window) {
            try {
                const pipWindow = await window.documentPictureInPicture!.requestWindow({
                    width: 400,
                    height: 300,
                });

                this.pipWindow = pipWindow;

                // Copy styles to PiP window
                this.copyStylesToWindow(pipWindow);

                // Create timer UI in PiP window
                this.createPipTimerUI(pipWindow, task);
            } catch (error) {
                console.error('Failed to open Picture-in-Picture window:', error);
                // Fallback: Open regular popup window
                this.openRegularPopup(task);
            }
        } else {
            // Fallback: Open regular popup window
            this.openRegularPopup(task);
        }
    }

    private copyStylesToWindow(targetWindow: Window): void {
        const styleSheets = Array.from(document.styleSheets);
        styleSheets.forEach((styleSheet) => {
            try {
                const cssRules = Array.from(styleSheet.cssRules)
                    .map((rule) => rule.cssText)
                    .join('');
                const style = targetWindow.document.createElement('style');
                style.textContent = cssRules;
                targetWindow.document.head.appendChild(style);
            } catch (e) {
                const link = targetWindow.document.createElement('link');
                link.rel = 'stylesheet';
                link.href = (styleSheet as CSSStyleSheet).href || '';
                targetWindow.document.head.appendChild(link);
            }
        });
    }

    private createPipTimerUI(pipWindow: Window, task: Task): void {
        // Use saved timer state if available, otherwise use estimated time
        let remainingTime = task.timerState?.remainingTime ?? task.estimatedTime * 60;
        let isPaused = task.timerState?.isPaused ?? false;
        const totalTime = task.estimatedTime * 60;

        const container = pipWindow.document.createElement('div');
        container.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
            padding: 20px;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;

        const title = pipWindow.document.createElement('div');
        title.textContent = task.title;
        title.style.cssText = `
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
            text-align: center;
        `;

        const timerDisplay = pipWindow.document.createElement('div');
        timerDisplay.style.cssText = `
            font-size: 48px;
            font-weight: bold;
            color: #1a1a1a;
            margin: 20px 0;
        `;

        const progressBar = pipWindow.document.createElement('div');
        progressBar.style.cssText = `
            width: 100%;
            height: 8px;
            background: #e5e5e5;
            border-radius: 4px;
            overflow: hidden;
            margin: 20px 0;
        `;

        const progressFill = pipWindow.document.createElement('div');
        progressFill.style.cssText = `
            height: 100%;
            background: #22c55e;
            border-radius: 4px;
            transition: width 0.3s ease, background 0.3s ease;
            width: 0%;
        `;
        progressBar.appendChild(progressFill);

        const buttonContainer = pipWindow.document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 20px;
        `;

        const pauseButton = pipWindow.document.createElement('button');
        pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
        pauseButton.style.cssText = `
            padding: 8px 16px;
            background: #f3f4f6;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;

        const completeButton = pipWindow.document.createElement('button');
        completeButton.textContent = 'Complete';
        completeButton.style.cssText = `
            padding: 8px 16px;
            background: #22c55e;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;

        const updateTimer = () => {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            const progress = ((totalTime - remainingTime) / totalTime) * 100;
            progressFill.style.width = `${progress}%`;

            const isLowTime = remainingTime <= totalTime * 0.2;
            progressFill.style.background = isLowTime ? '#ef4444' : '#22c55e';
            timerDisplay.style.color = isLowTime ? '#ef4444' : '#1a1a1a';
        };

        pauseButton.onclick = () => {
            isPaused = !isPaused;
            pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
            // Save state when paused/resumed
            this.onStateChangeCallback(task.id, remainingTime, isPaused);
        };

        completeButton.onclick = () => {
            const actualTime = totalTime - remainingTime;
            this.onCompleteCallback(task.id, actualTime);
            if (this.timerInterval) clearInterval(this.timerInterval);
            this.currentTaskId = null;
            pipWindow.close();
        };

        this.timerInterval = setInterval(() => {
            if (!isPaused && remainingTime > 0) {
                remainingTime--;
                updateTimer();

                // Save state every 5 seconds
                if (remainingTime % 5 === 0) {
                    this.onStateChangeCallback(task.id, remainingTime, isPaused);
                }

                if (remainingTime === 0) {
                    this.onCompleteCallback(task.id, totalTime);
                    if (this.timerInterval) clearInterval(this.timerInterval);
                    this.currentTaskId = null;
                    pipWindow.close();
                }
            }
        }, 1000);

        updateTimer();

        container.appendChild(title);
        container.appendChild(timerDisplay);
        container.appendChild(progressBar);
        buttonContainer.appendChild(pauseButton);
        buttonContainer.appendChild(completeButton);
        container.appendChild(buttonContainer);

        pipWindow.document.body.appendChild(container);
        pipWindow.document.body.style.margin = '0';
        pipWindow.document.body.style.padding = '0';

        // Save state when window closes
        pipWindow.addEventListener('beforeunload', () => {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            // Save final state before closing
            this.onStateChangeCallback(task.id, remainingTime, isPaused);
            this.currentTaskId = null;
        });
    }

    private openRegularPopup(task: Task): void {
        // Use saved timer state if available
        const initialTime = task.timerState?.remainingTime ?? task.estimatedTime * 60;
        const initialPaused = task.timerState?.isPaused ?? false;

        const popupWindow = window.open(
            '',
            'FocusTimer',
            'width=400,height=300,left=100,top=100'
        );

        if (popupWindow) {
            this.pipWindow = popupWindow;

            popupWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Focus Timer - ${task.title}</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 20px;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            background: white;
                        }
                        .title { font-size: 16px; font-weight: 600; margin-bottom: 10px; }
                        .timer { font-size: 48px; font-weight: bold; margin: 20px 0; }
                        .progress-bar {
                            width: 100%;
                            height: 8px;
                            background: #e5e5e5;
                            border-radius: 4px;
                            overflow: hidden;
                            margin: 20px 0;
                        }
                        .progress-fill {
                            height: 100%;
                            background: #22c55e;
                            transition: width 0.3s ease;
                        }
                        .buttons { display: flex; gap: 10px; margin-top: 20px; }
                        button {
                            padding: 8px 16px;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 500;
                        }
                        .pause-btn { background: #f3f4f6; }
                        .complete-btn { background: #22c55e; color: white; }
                    </style>
                </head>
                <body>
                    <div class="title">${task.title}</div>
                    <div class="timer" id="timer">30:00</div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress"></div>
                    </div>
                    <div class="buttons">
                        <button class="pause-btn" id="pauseBtn">Pause</button>
                        <button class="complete-btn" onclick="completeTask()">Complete</button>
                    </div>
                    <script>
                        let remainingTime = ${initialTime};
                        let isPaused = ${initialPaused};
                        const totalTime = ${task.estimatedTime * 60};
                        let stateUpdateCounter = 0;
                        
                        function updateDisplay() {
                            const mins = Math.floor(remainingTime / 60);
                            const secs = remainingTime % 60;
                            document.getElementById('timer').textContent = 
                                mins + ':' + secs.toString().padStart(2, '0');
                            
                            const progress = ((totalTime - remainingTime) / totalTime) * 100;
                            document.getElementById('progress').style.width = progress + '%';
                        }
                        
                        function togglePause() {
                            isPaused = !isPaused;
                            document.getElementById('pauseBtn').textContent = isPaused ? 'Resume' : 'Pause';
                            // Notify parent of state change
                            window.opener.postMessage({
                                type: 'TIMER_STATE_CHANGE',
                                taskId: '${task.id}',
                                remainingTime: remainingTime,
                                isPaused: isPaused
                            }, '*');
                        }
                        
                        function completeTask() {
                            window.opener.postMessage({ 
                                type: 'TASK_COMPLETE', 
                                taskId: '${task.id}',
                                actualTime: totalTime - remainingTime
                            }, '*');
                            window.close();
                        }
                        
                        document.getElementById('pauseBtn').onclick = togglePause;
                        
                        setInterval(() => {
                            if (!isPaused && remainingTime > 0) {
                                remainingTime--;
                                updateDisplay();
                                
                                // Save state every 5 seconds
                                stateUpdateCounter++;
                                if (stateUpdateCounter >= 5) {
                                    stateUpdateCounter = 0;
                                    window.opener.postMessage({
                                        type: 'TIMER_STATE_CHANGE',
                                        taskId: '${task.id}',
                                        remainingTime: remainingTime,
                                        isPaused: isPaused
                                    }, '*');
                                }
                                
                                if (remainingTime === 0) {
                                    completeTask();
                                }
                            }
                        }, 1000);
                        
                        // Save state before closing
                        window.addEventListener('beforeunload', () => {
                            window.opener.postMessage({
                                type: 'TIMER_STATE_CHANGE',
                                taskId: '${task.id}',
                                remainingTime: remainingTime,
                                isPaused: isPaused
                            }, '*');
                        });
                        
                        updateDisplay();
                        if (isPaused) {
                            document.getElementById('pauseBtn').textContent = 'Resume';
                        }
                    </script>
                </body>
                </html>
            `);
            popupWindow.document.close();
        } else {
            alert('Popup was blocked. Please allow popups for this site.');
        }
    }

    isTimerActive(taskId: string): boolean {
        return this.currentTaskId === taskId && this.pipWindow !== null && !this.pipWindow.closed;
    }

    cleanup(): void {
        if (this.pipWindow && !this.pipWindow.closed) {
            this.pipWindow.close();
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.currentTaskId = null;
    }
}