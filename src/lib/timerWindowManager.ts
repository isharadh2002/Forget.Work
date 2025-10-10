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

    constructor(onComplete: (taskId: string, actualTime: number) => void) {
        this.onCompleteCallback = onComplete;
    }

    async openTimer(task: Task): Promise<void> {
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
        let remainingTime = task.estimatedTime * 60;
        let isPaused = false;

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
        pauseButton.textContent = 'Pause';
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

            const progress = ((task.estimatedTime * 60 - remainingTime) / (task.estimatedTime * 60)) * 100;
            progressFill.style.width = `${progress}%`;

            const isLowTime = remainingTime <= task.estimatedTime * 60 * 0.2;
            progressFill.style.background = isLowTime ? '#ef4444' : '#22c55e';
            timerDisplay.style.color = isLowTime ? '#ef4444' : '#1a1a1a';
        };

        pauseButton.onclick = () => {
            isPaused = !isPaused;
            pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
        };

        completeButton.onclick = () => {
            const actualTime = task.estimatedTime * 60 - remainingTime;
            this.onCompleteCallback(task.id, actualTime);
            if (this.timerInterval) clearInterval(this.timerInterval);
            pipWindow.close();
        };

        this.timerInterval = setInterval(() => {
            if (!isPaused && remainingTime > 0) {
                remainingTime--;
                updateTimer();

                if (remainingTime === 0) {
                    this.onCompleteCallback(task.id, task.estimatedTime * 60);
                    if (this.timerInterval) clearInterval(this.timerInterval);
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

        // Cleanup when PiP window closes
        pipWindow.addEventListener('unload', () => {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
        });
    }

    private openRegularPopup(task: Task): void {
        const popupWindow = window.open(
            '',
            'FocusTimer',
            'width=400,height=300,left=100,top=100'
        );

        if (popupWindow) {
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
                        <button class="pause-btn" onclick="togglePause()">Pause</button>
                        <button class="complete-btn" onclick="completeTask()">Complete</button>
                    </div>
                    <script>
                        let remainingTime = ${task.estimatedTime * 60};
                        let isPaused = false;
                        const totalTime = ${task.estimatedTime * 60};
                        
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
                            event.target.textContent = isPaused ? 'Resume' : 'Pause';
                        }
                        
                        function completeTask() {
                            window.opener.postMessage({ 
                                type: 'TASK_COMPLETE', 
                                taskId: '${task.id}',
                                actualTime: totalTime - remainingTime
                            }, '*');
                            window.close();
                        }
                        
                        setInterval(() => {
                            if (!isPaused && remainingTime > 0) {
                                remainingTime--;
                                updateDisplay();
                                if (remainingTime === 0) {
                                    completeTask();
                                }
                            }
                        }, 1000);
                        
                        updateDisplay();
                    </script>
                </body>
                </html>
            `);
            popupWindow.document.close();
        } else {
            alert('Popup was blocked. Please allow popups for this site.');
        }
    }

    cleanup(): void {
        if (this.pipWindow) {
            this.pipWindow.close();
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }
}