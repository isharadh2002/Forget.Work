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
                    width: 420,
                    height: 120,
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

    private formatTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
            background: #ffffff;
            padding: 20px;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            gap: 12px;
        `;

        const title = pipWindow.document.createElement('div');
        title.textContent = task.title;
        title.style.cssText = `
            font-size: 14px;
            font-weight: 500;
            color: #333;
            text-align: center;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;

        const timerRow = pipWindow.document.createElement('div');
        timerRow.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
        `;

        const timerDisplay = pipWindow.document.createElement('div');
        timerDisplay.style.cssText = `
            font-size: 32px;
            font-weight: 700;
            color: #1a1a1a;
            font-variant-numeric: tabular-nums;
            letter-spacing: 0.5px;
        `;

        const buttonContainer = pipWindow.document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 8px;
        `;

        const pauseButton = pipWindow.document.createElement('button');
        pauseButton.innerHTML = isPaused ? '&#9654;' : '&#10074;&#10074;';
        pauseButton.style.cssText = `
            width: 40px;
            height: 40px;
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            color: #374151;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;
        pauseButton.onmouseover = () => {
            pauseButton.style.background = '#e5e7eb';
            pauseButton.style.transform = 'scale(1.05)';
        };
        pauseButton.onmouseout = () => {
            pauseButton.style.background = '#f3f4f6';
            pauseButton.style.transform = 'scale(1)';
        };

        const completeButton = pipWindow.document.createElement('button');
        completeButton.innerHTML = '&#10003;';
        completeButton.style.cssText = `
            width: 40px;
            height: 40px;
            background: #22c55e;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;
        completeButton.onmouseover = () => {
            completeButton.style.background = '#16a34a';
            completeButton.style.transform = 'scale(1.05)';
        };
        completeButton.onmouseout = () => {
            completeButton.style.background = '#22c55e';
            completeButton.style.transform = 'scale(1)';
        };

        const updateTimer = () => {
            timerDisplay.textContent = this.formatTime(remainingTime);

            const isLowTime = remainingTime <= totalTime * 0.2;
            timerDisplay.style.color = isLowTime ? '#ef4444' : '#1a1a1a';
        };

        pauseButton.onclick = () => {
            isPaused = !isPaused;
            pauseButton.innerHTML = isPaused ? '&#9654;' : '&#10074;&#10074;';
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
        timerRow.appendChild(timerDisplay);
        timerRow.appendChild(buttonContainer);
        buttonContainer.appendChild(pauseButton);
        buttonContainer.appendChild(completeButton);
        container.appendChild(timerRow);

        pipWindow.document.body.appendChild(container);
        pipWindow.document.body.style.margin = '0';
        pipWindow.document.body.style.padding = '0';
        pipWindow.document.body.style.overflow = 'auto';

        // Hide scrollbars but keep scrolling functionality
        const style = pipWindow.document.createElement('style');
        style.textContent = `
            body::-webkit-scrollbar {
                display: none;
            }
            body {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `;
        pipWindow.document.head.appendChild(style);

        pipWindow.addEventListener('beforeunload', () => {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            this.onStateChangeCallback(task.id, remainingTime, isPaused);
            this.currentTaskId = null;
        });
    }

    private openRegularPopup(task: Task): void {
        const initialTime = task.timerState?.remainingTime ?? task.estimatedTime * 60;
        const initialPaused = task.timerState?.isPaused ?? false;

        const popupWindow = window.open(
            '',
            'FocusTimer',
            'width=420,height=120,left=100,top=100,resizable=no,scrollbars=no'
        );

        if (popupWindow) {
            this.pipWindow = popupWindow;

            // Force window size after opening
            popupWindow.resizeTo(420, 120);

            popupWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Focus Timer - ${task.title}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        html, body {
                            height: 100%;
                            overflow: auto;
                        }
                        /* Hide scrollbars but keep scrolling */
                        body::-webkit-scrollbar {
                            display: none;
                        }
                        body {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .container {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            width: 100%;
                            height: 100%;
                            padding: 20px;
                            gap: 12px;
                            background: #ffffff;
                        }
                        .title {
                            font-size: 14px;
                            font-weight: 500;
                            color: #333;
                            text-align: center;
                            width: 100%;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }
                        .timer-row {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 16px;
                        }
                        .timer {
                            font-size: 32px;
                            font-weight: 700;
                            color: #1a1a1a;
                            font-variant-numeric: tabular-nums;
                            letter-spacing: 0.5px;
                        }
                        .timer.low-time {
                            color: #ef4444;
                        }
                        .buttons {
                            display: flex;
                            gap: 8px;
                        }
                        button {
                            width: 40px;
                            height: 40px;
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s ease;
                        }
                        .pause-btn {
                            background: #f3f4f6;
                            border: 1px solid #e5e7eb;
                            color: #374151;
                            font-size: 14px;
                        }
                        .pause-btn:hover {
                            background: #e5e7eb;
                            transform: scale(1.05);
                        }
                        .complete-btn {
                            background: #22c55e;
                            border: none;
                            color: #ffffff;
                            font-size: 18px;
                            font-weight: bold;
                        }
                        .complete-btn:hover {
                            background: #16a34a;
                            transform: scale(1.05);
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="title">${task.title}</div>
                        <div class="timer-row">
                            <div class="timer" id="timer">0:00</div>
                            <div class="buttons">
                                <button class="pause-btn" id="pauseBtn">&#10074;&#10074;</button>
                                <button class="complete-btn" onclick="completeTask()">&#10003;</button>
                            </div>
                        </div>
                    </div>
                    <script>
                        let remainingTime = ${initialTime};
                        let isPaused = ${initialPaused};
                        const totalTime = ${task.estimatedTime * 60};
                        let stateUpdateCounter = 0;
                        
                        function formatTime(seconds) {
                            const hours = Math.floor(seconds / 3600);
                            const minutes = Math.floor((seconds % 3600) / 60);
                            const secs = seconds % 60;
                            
                            if (hours > 0) {
                                return hours + ':' + 
                                       minutes.toString().padStart(2, '0') + ':' + 
                                       secs.toString().padStart(2, '0');
                            }
                            return minutes + ':' + secs.toString().padStart(2, '0');
                        }
                        
                        function updateDisplay() {
                            const timerEl = document.getElementById('timer');
                            timerEl.textContent = formatTime(remainingTime);
                            
                            const isLowTime = remainingTime <= totalTime * 0.2;
                            if (isLowTime) {
                                timerEl.classList.add('low-time');
                            } else {
                                timerEl.classList.remove('low-time');
                            }
                        }
                        
                        function togglePause() {
                            isPaused = !isPaused;
                            document.getElementById('pauseBtn').innerHTML = isPaused ? '&#9654;' : '&#10074;&#10074;';
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
                            document.getElementById('pauseBtn').innerHTML = '&#9654;';
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