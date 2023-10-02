isTouchingScreen = undefined;
settings = {
    "touch3d": {
        "firmly_judgement_pressure": 0.9,
        "long_press_duration": 0.3
    }
};
mouseDownOn = undefined;
const audioSources = {
    ui: {
        press: 'click_down.mp3',
        release: 'click_up.mp3',
        hover: 'hover.mp3',
        change: 'change.mp3',
        click: 'click.mp3',
        input: 'input.mp3',
        move_cursor: "move_cursor.mp3",
        select_all: "select_all.mp3",
        select_cancel: "select_cancel.mp3",
        select_char: "select_char.mp3",
        select_word: "select_word.mp3",
        candidate: "candidate.mp3",
        backspace: "backspace.mp3"
    },
    chart: {
        enter: 'enter_chart.mp3',
        detail: 'chart_detail.mp3'
    }
}; // 音频文件的URL
const audioElements = {};
// 检测触摸屏
if ('ontouchstart' in window || navigator.maxTouchPoints) {
    // 这个设备支持触摸屏
    console.log('这是触摸屏设备');
    isTouchingScreen = true;
} else {
    // 这个设备不支持触摸屏，可能是鼠标设备
    console.log('这是鼠标设备');
    isTouchingScreen = false;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

class Chart {
    constructor() {
        // todo
    }
}

Init = {
    updatePressureScale() {
        const $pressure = $("[data-pressure-scale]");
        $pressure.each(function () {

            // 添加鼠标按下事件监听器
            $(document).on('pointerdown', function (event) {
                window.mouseDownOn = mouseDownOn || document;
                // 在这里执行鼠标按下时的操作
            });

            // 添加鼠标释放事件监听器
            $(document).on('pointerup', function (event) {
                window.mouseDownOn = mouseDownOn;
                // 在这里执行鼠标释放时的操作
            });
            const maxScale = $(this).attr("data-pressure-scale");
            const $element = this;

            function updatePressure(pressure, event) {
                if ($element.isFirming) {
                    pressure = 1;
                }
                $($element).css({"transform": `scale(${(maxScale - 1) * pressure + 1})`});
                if (pressure === 1) {
                    $($element).addClass("firm");
                } else {
                    $($element).removeClass("firm");
                }
            }

            updatePressure();

            function onPress(event) {
                const maxPressure = settings.touch3d.firmly_judgement_pressure;
                let pressure = 0.5;
                if ($element.isFirming) {
                    pressure = 1;
                } else if (event.pointerType === 'pen') {
                    // 检查事件类型是否为笔触事件
                    // 获取压力值
                    pressure = clamp(event.originalEvent.pressure / maxPressure, 0, 1);
                    console.log('压力：' + pressure);
                } else if (event.pointerType === 'touch') {
                    // 检查触摸点是否支持压力属性
                    if (event.originalEvent.pressure !== 0.5) {  // fixme: 现在只是应急措施
                        // 获取压力值
                        pressure = clamp(event.originalEvent.pressure / maxPressure, 0, 1);
                        console.log('压力：' + pressure);
                    }
                }
                if (pressure === 1 && !$element.isFirming) {
                    $element.isFirming = true;
                    console.log("长按触发（重压）");
                    if ($element.onFirmDown) $element.onFirmDown.call($element, event);
                    clearTimeout(timeoutId);
                }

                updatePressure(pressure);

                // 获取元素的位置
                const elementRect = $($element)[0].getBoundingClientRect();

                // 获取鼠标指针在垂直方向上的位置
                const mouseY = event.clientY;

                // 计算指针与元素之间的垂直距离
                const distance = mouseY - elementRect.top;

                console.log('指针距离元素的垂直距离：' + distance + ' 像素');
            }

            // 处理长按
            let timeoutId;
            const duration = settings.touch3d.long_press_duration * 1000;

            // 添加事件监听器来捕获点击事件
            $($element)
                .on('pointerdown', function (event) {
                    window.mouseDownOn = $element;
                    Sound.play(audioElements.ui.press);
                    timeoutId = setTimeout(function () {
                        $element.isFirming = true;
                        console.log("长按触发");
                        updatePressure();
                        if ($element.onFirmDown) $element.onFirmDown.call($element, event);
                    }, duration);
                    onPress(event);
                })
                .on('pointerenter', function (event) {
                    Sound.play(audioElements.ui.hover);
                    if (event.pointerType === 'touch') return;
                    $($element).addClass("hover");
                })
                .on('pointerleave', function () {
                    $element.isFirming = undefined;
                    clearTimeout(timeoutId);
                    $($element).removeClass("hover");
                })
                .on('contextmenu', function (event) {
                    event.preventDefault(); // 取消默认的上下文菜单
                });
            $(document)
                .on('pointerup', function (event) {
                    if (mouseDownOn === $element) {
                        window.mouseDownOn = undefined;
                        Sound.play(audioElements.ui.release);
                        $($element).css({"transform": ``});
                        if ($element.isFirming) {
                            if ($element.onFirmUp) $element.onFirmUp.call($element, event);
                        }
                    }
                    $element.isFirming = undefined;
                    clearTimeout(timeoutId);
                    $($element).removeClass("firm");
                })
                .on('pointermove', function (event) {
                    if (mouseDownOn !== $element) return;
                    onPress(event);
                });
        });
    },
    updateChartCover() {
        $("[data-enter-chart]").firmDown(function () {
            $(this).css({"scale": "2", "opacity": 0, "transition": "0.5s"});
            Operation.enterChart($(this).attr("data-enter-chart"));
        });
    },
    preloadSounds() {

        function loadAudio(source) {
            const audio = new Audio("/static/sound/" + source);
            audio.load(); // 预加载音频
            return audio;
        }

        function traverseAndLoad(sourceObj, targetObj) {
            for (const key in sourceObj) {
                if (sourceObj.hasOwnProperty(key)) {
                    if (typeof sourceObj[key] === 'string') {
                        targetObj[key] = loadAudio(sourceObj[key]);
                    } else if (typeof sourceObj[key] === 'object') {
                        targetObj[key] = {};
                        traverseAndLoad(sourceObj[key], targetObj[key]);
                    }
                }
            }
        }

        traverseAndLoad(audioSources, audioElements);
    },
    updateSubSound() {
        $(".sidebar-item").each(function () {
            const $element = this;
            $($element)
                .on('pointerenter', function () {
                    Sound.play(audioElements.ui.hover);
                })
                .on('pointerdown', function () {
                    Sound.play(audioElements.ui.press);
                })
                .on('pointerup', function () {
                    Sound.play(audioElements.ui.release);
                })
                .on('click', function () {
                    Operation.changeSidebar($($element).find(".sidebar-title").text());
                });
        });
        $(".top-right img").each(function () {
            const $element = this;
            $($element)
                .on('pointerenter', function () {
                    Sound.play(audioElements.ui.hover);
                })
                .on('pointerdown', function () {
                    Sound.play(audioElements.ui.press);
                })
                .on('pointerup', function () {
                    Sound.play(audioElements.ui.release);
                })
                .on('click', function () {
                    Sound.play(audioElements.ui.click);
                });
        });
        $("input").each(function () {
            const $element = this;

            function getSelectedCharCount() {
                const selectionStart = $element.selectionStart;
                const selectionEnd = $element.selectionEnd;
                if (selectionStart !== null && selectionEnd !== null) {
                    const selectedText = $element.value.substring(selectionStart, selectionEnd);
                    const selectedCharCount = selectedText.length;
                    console.log(`选中字符数: ${selectedCharCount}`);
                    // Sound.setPitch(audioElements.ui.select_char, 1 + selectedCharCount * 0.1);
                    return selectedCharCount;
                } else {
                    console.log("没有选中文本");
                    return 0;
                }
            }

            $($element)
                .on('pointerdown', function (event) {
                    Sound.play(audioElements.ui.press);
                    if (!event.shiftKey && $element.selecting) {
                        $element.selecting = false;
                        Sound.play(audioElements.ui.select_cancel);
                    }
                })
                .on('pointerup', function () {
                    Sound.play(audioElements.ui.release);
                })
                .on('input', function (event) {
                    setTimeout(function () {
                        if (event.originalEvent.inputType === "deleteContentBackward" || event.originalEvent.inputType === "deleteContentForward") {
                            Sound.play(audioElements.ui.backspace);
                        } else {
                            if ($element.isComposing) {
                                $element.isComposing = false;
                            } else {
                                Sound.play(audioElements.ui.input);
                            }
                        }
                    });
                })
                .on('keydown', function (event) {
                    setTimeout(function () {
                        if (!event.shiftKey && $element.selecting) {
                            $element.selecting = false;
                            Sound.play(audioElements.ui.select_cancel);
                        }
                        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                            if (getSelectedCharCount() === 0) {
                                if ($element.selecting) {
                                    $element.selecting = false;
                                    Sound.play(audioElements.ui.select_cancel);
                                } else {
                                    Sound.play(audioElements.ui.move_cursor);
                                }
                            } else {
                                $element.selecting = true;
                                Sound.play(audioElements.ui.select_char);
                            }
                        }
                    });
                })
                .on('select', function () {
                    if (mouseDownOn) {
                        if (getSelectedCharCount() > 0) {
                            $element.selecting = true;
                            Sound.play(audioElements.ui.select_char);
                        }
                    } else {
                        Sound.play(audioElements.ui.select_all);
                    }
                })
                .on('dblclick', function () {
                    Sound.play(audioElements.ui.select_word);
                })
                .on('compositionend', function (event) {
                    Sound.play(audioElements.ui.candidate);
                    $element.isComposing = true;
                });
        });
    },
    showPage() {
    }

};

Operation = {
    enterChart(chartID) {
        Sound.play(audioElements.chart.enter);
        Effect.showBlackCurtain();
        setTimeout(function () {
            alert(`然后你进入了${chartID}号谱面`);
            window.location.reload();
        }, 1000);
    },
    chartDetail(chartID) {

    },
    changeSidebar(sidebar) {
        Sound.play(audioElements.ui.change);
        console.log(`切换侧边栏：${sidebar}`);
    }
};

Effect = {
    showBlackCurtain() {
        $(".black-curtain").show().addClass("show");
    }
};

Sound = {
    play(audio) {
        if (typeof audio === 'string') {
            Sound.getElement(audio).currentTime = 0;
            Sound.getElement(audio).play();
        } else if (typeof audio === 'object') {
            audio.currentTime = 0;
            audio.play();
        }
    },
    getElement(soundID) {
        return eval(`audioElements.${soundID}`);
    },
    setPitch(audio, pitch) {
        // 未实现

        const audioElement = audio;

        if (!audioElement.pitchShiftNode) {

            // 创建音频上下文
            const audioContext = new AudioContext();

            // 创建音频源
            const sourceNode = audioContext.createMediaElementSource(audioElement);

            // 创建音高变换节点
            const pitchShiftNode = audioContext.createScriptProcessor(256, 2, 2);

            // 连接音频源到音高变换节点
            sourceNode.connect(pitchShiftNode);

            // 连接音高变换节点到音频目标（扬声器）
            pitchShiftNode.connect(audioContext.destination);
            audioElement.pitchShiftNode = pitchShiftNode;
        }
        const pitchShiftNode = audioElement.pitchShiftNode;
        const pitchShiftValue = pitch; // 调整音高的倍数，可以根据需要修改

        // 直接修改音高变换节点的频率
        pitchShiftNode.onaudioprocess = function (event) {
            const inputBuffer = event.inputBuffer;
            const outputBuffer = event.outputBuffer;

            for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
                const inputData = inputBuffer.getChannelData(channel);
                const outputData = outputBuffer.getChannelData(channel);

                for (let i = 0; i < inputBuffer.length; i++) {
                    const currentSample = inputData[i];
                    outputData[i] = currentSample * pitchShiftValue;
                }
            }
        };

        // 更新音高后，重新加载音频以应用更改
        audioElement.load();
    }
};
$(function () {
    Init.updatePressureScale();
    Init.updateChartCover();
    Init.preloadSounds();
    Init.updateSubSound();
});