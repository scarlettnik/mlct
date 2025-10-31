'use client';

import React, { useEffect, useState, useRef, useMemo, type JSX } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    type ChartOptions,
    type ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";
import "./style.css";
import UploadModal from "@/features/patients/components/UploadData";
import ParamModal from "@/features/charts/components/ParamModal";
import HRTSettingsModal from "@/features/patients/components/HRTSettingsModal";
import NextPartModal from "@/shared/ui/GoToNetx";
import MonInfo from "@/features/monitoring/components/MonInfo";
import { websocketUrl } from "@/shared/api/api";
import type { ExaminationStats } from "@/shared/api/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, annotationPlugin);

const ALERT_SOUND_PATH = "/alarm.mp3";

interface WSInterval {
    start: number;
    end: number;
    message?: string;
}

interface WSPrediction {
    messages?: string[];
}

interface WSPlotPoint {
    channel: "bpm" | "uterus";
    point: [number, number]; // [time, value]
}

interface SocketMessage {
    interval?: WSInterval;
    prediction?: WSPrediction;
    stats?: ExaminationStats;
    status?: string;
    plot?: WSPlotPoint;
}

interface Point {
    x: number;
    y: number;
}

interface HRTThresholds {
    min: number;
    max: number;
    volume: number;
}

const safeParseJSON = (raw: string): SocketMessage | null => {
    try {
        let parsed = JSON.parse(raw);
        if (typeof parsed === "string") parsed = JSON.parse(parsed);
        return parsed as SocketMessage;
    } catch (e) {
        console.warn("safeParseJSON failed:", e, raw);
        return null;
    }
};

const generateOptions = (
    yMin: number,
    yMax: number,
    xMin: number,
    xMax: number,
    annotations: Record<string, any> = {}
): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        annotation: { annotations },
    },
    scales: {
        x: {
            type: "linear",
            display: true,
            min: xMin,
            max: xMax,
            ticks: {
                color: "black",
                stepSize: 3,
                callback: (tickValue: string | number) => {
                    const value = Number(tickValue);
                    const m = Math.floor(value / 60);
                    const s = Math.floor(value % 60);
                    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
                },
            },
            grid: { color: "rgba(38, 55, 70, 0.16)" },
        },
        y: {
            display: true,
            min: yMin,
            max: yMax,
            ticks: { color: "black", stepSize: 10 },
            grid: { color: "rgba(38, 55, 70, 0.14)" },
        },
    },
    elements: {
        line: { borderWidth: 2, tension: 0 },
        point: { radius: 0 },
    },
});

const makeBoxAnnotations = (intervals: WSInterval[]): Record<string, any> =>
    Object.fromEntries(
        intervals.map((a, i) => [
            `interval-${i}`,
            {
                type: "box",
                xMin: a.start,
                xMax: a.end,
                yMin: '0%',
                yMax: '100%',
                yScaleID: 'y',

                backgroundColor: "rgba(255, 99, 132, 0.25)",
                borderColor: "rgba(255, 99, 132, 0.8)",
                borderWidth: 1,
                drawTime: "beforeDatasetsDraw",
                label: {
                    display: !!a.message,
                    content: a.message || "",
                    position: "start",
                    color: "black",
                    backgroundColor: "rgba(255,255,255,0.8)",
                    font: { size: 10 },
                },
            },
        ])
    );

function Clock(): JSX.Element {
    const [timeStr, setTimeStr] = useState<string>("");
    useEffect(() => {
        const update = () => setTimeStr(new Date().toLocaleString());
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);
    return <span>{timeStr}</span>;
}

export default function FetalMonitor(): JSX.Element {
    const [heartRateData, setHeartRateData] = useState<Point[]>([]);
    const [toneData, setToneData] = useState<Point[]>([]);
    const [latestTime, setLatestTime] = useState<number>(0);
    const [analysisStats, setAnalysisStats] = useState<ExaminationStats | null>(null);
    const [intervals, setIntervals] = useState<WSInterval[]>([]);
    const [prediction, setPrediction] = useState<WSPrediction>({});
    const [patientId, setPatientId] = useState<string | null>(null);
    const [patInfo, setPatInfo] = useState<boolean>(false);
    const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);


    const socketRef = useRef<WebSocket | null>(null);
    const bufferSeconds = 600;

    const [wsUrl, setWsUrl] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(true);
    const [paramModalOpen, setParamModalOpen] = useState<boolean>(false);
    const [isDangerModalOpen, setIsDangerModalOpen] = useState<boolean>(false);
    const [isNextModalOpen, setIsNextModalOpen] = useState<boolean>(false);
    const [hrtThresholds, setHrtThresholds] = useState<HRTThresholds>({ min: 60, max: 160, volume: 80 });
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [viewStart, setViewStart] = useState<number>(0);
    const viewDuration = 90;

    useEffect(() => {
        if (typeof window !== "undefined" && !audioRef.current) {
            audioRef.current = new Audio(ALERT_SOUND_PATH);
        }
    }, []);

    const currentHR = heartRateData.length
        ? Math.round(heartRateData[heartRateData.length - 1].y)
        : 0;
    const currentUC = toneData.length
        ? Math.round(toneData[toneData.length - 1].y)
        : 0;

    const isHRTAlert =
        currentHR > 0 &&
        (currentHR < hrtThresholds.min || currentHR > hrtThresholds.max);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !isSoundEnabled) return;
        audio.volume = hrtThresholds.volume / 100;
        audio.loop = true;

        if (isHRTAlert) {
            audio.play().catch(() => {});
        } else {
            audio.pause();
            audio.currentTime = 0;
        }
        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, [isHRTAlert, hrtThresholds.volume, isSoundEnabled]);

    useEffect(() => {
        setViewStart(Math.max(0, latestTime - viewDuration));
    }, [latestTime]);

    useEffect(() => {
        if (!wsUrl) return;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onmessage = (event: MessageEvent) => {
            const msg = safeParseJSON(event.data);
            if (!msg) return;

            if (msg.interval) {
                setIntervals((prev) => {
                    const newInt = msg.interval;
                    if (!newInt || typeof newInt.start !== 'number' || typeof newInt.end !== 'number') return prev;
                    const exists = prev.some(
                        (i) => i.start === newInt.start && i.end === newInt.end
                    );
                    if (exists) return prev;
                    return [...prev, newInt];
                });
                return;
            }

            if (msg.prediction) {
                setPrediction(msg.prediction);
            }

            if (msg.stats) {
                setAnalysisStats(msg.stats);
                return;
            }

            if (msg.status === "waiting-for-next-command") {
                setIsNextModalOpen(true);
                return;
            }

            if (msg.plot && Array.isArray(msg.plot.point)) {
                const { channel, point } = msg.plot;
                const [time, value] = point.map(Number);
                if (!Number.isFinite(time) || !Number.isFinite(value)) return;

                const updateData = (prev: Point[]) => {
                    const cutoff = time - bufferSeconds;
                    const filtered = prev.filter((p) => p.x >= cutoff);
                    return [...filtered, { x: time, y: value }];
                };

                if (channel === "bpm") setHeartRateData(updateData);
                if (channel === "uterus") setToneData(updateData);
                setLatestTime(time);
            }
        };

        ws.onerror = (e) => console.error("WS error:", e);

        return () => ws.close();
    }, [wsUrl]);

    const handleUploadSuccess = (patientId: string, serverData: any) => {
        setIsModalOpen(false);
        const examId = serverData?.id;
        if (!examId) return alert("Не удалось получить ID обследования");
        setPatientId(patientId);
        const newWsUrl = websocketUrl(`/v1/patients/${patientId}/examinations/${examId}/emulation/start`);
        setWsUrl(newWsUrl);
        setHeartRateData([]);
        setToneData([]);
        setIntervals([]);
        setLatestTime(0);
        setViewStart(0);
        setAnalysisStats(null);
    };

    const handleNextPart = () => {
        socketRef.current?.send(JSON.stringify({ command: "next-part" }));
        setHeartRateData([]);
        setToneData([]);
        setIntervals([]);
        setIsNextModalOpen(false);
        setAnalysisStats(null);
    };

    const annotations = makeBoxAnnotations(intervals);

    const xMin = viewStart;
    const xMax = viewStart + viewDuration;

    const lastInterval = useMemo(() => {
        if (intervals.length === 0) return null;
        return intervals[intervals.length - 1];
    }, [intervals]);

    const heartRateChartData: ChartData<'line'> = useMemo(
        () => ({
            datasets: [
                {
                    label: "BPM",
                    data: heartRateData,
                    borderColor: "#13736f",
                    borderWidth: 2,
                    pointRadius: 0,
                },
            ],
        }),
        [heartRateData]
    );

    const toneChartData: ChartData<'line'> = useMemo(
        () => ({
            datasets: [
                {
                    label: "Tone",
                    data: toneData,
                    borderColor: "#27687b",
                    borderWidth: 2,
                    pointRadius: 0,
                },
            ],
        }),
        [toneData]
    );

    const heartRateOptions = useMemo(
        () => generateOptions(70, 230, xMin, xMax, annotations),
        [xMin, xMax, annotations]
    );
    const toneOptions = useMemo(
        () => generateOptions(0, 100, xMin, xMax, annotations),
        [xMin, xMax, annotations]
    );

    return (
        <>
            <div className="fm-container">
                <div className="fm-header">
                    <span>MONITORING MODE</span>
                    <span><Clock/></span>
                </div>

                <div className="fm-main">
                    <div className="fm-graphs">
                        <div className="fm-graph">
                            <Line data={heartRateChartData as any} options={heartRateOptions}/>
                        </div>
                        <div className="fm-graph">
                            <Line data={toneChartData as any} options={toneOptions}/>
                        </div>
                    </div>

                    <div className="fm-sidebar">
                        <div className="fm-value">
                            <div>US1</div>
                            <div className="fm-value-number lime">{currentHR}</div>
                        </div>
                        <div className="fm-value">
                            <div>UC</div>
                            <div className="fm-value-number red">{currentUC}</div>
                        </div>

                        <div className="fm-analysis-info">
                            <p className="fm-panel-title">Информация о последнем подозрительном участке</p>
                            {intervals.length > 0 ? (
                                <>
                                    <div className="fm-analysis-item">
                                        <div className="fm-analysis-label">Продолжительность:</div>
                                        <div
                                            className="fm-analysis-value">{Math.round(Math.abs((lastInterval?.end || 0) - (lastInterval?.start || 0)))} сек
                                        </div>
                                    </div>
                                    <div className="fm-analysis-item">
                                        <div className="fm-analysis-label">Информация</div>
                                        <div className="fm-analysis-value">{lastInterval?.message}</div>
                                    </div>
                                </>
                            ) : (
                                <p>Подозрительных моментов не обнаружено</p>
                            )}
                        </div>

                        <div className="fm-analysis-info">
                            <p className="fm-panel-title">Предсказание</p>
                            {prediction.messages && prediction.messages.length > 0 ? (
                                <>
                                    {prediction.messages.map((msg, index) => (
                                        <p key={index}>{msg}</p>
                                    ))}
                                </>
                            ) : (
                                <p>Пока нет информации. Появляется после первой минуты исследования</p>
                            )}
                        </div>
                    </div>
                </div>

                <footer className="fm-footer">
                    <button className="fm-button"
                            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                    >
                        {isSoundEnabled ? "Выключить звук тревоги" : "Включить звук тревоги"}
                    </button>
                    <button className="fm-button"
                            onClick={() => setIsDangerModalOpen(true)}>Параметры тревоги
                    </button>
                    <button className="fm-button" onClick={() => setPatInfo(true)}>Информация о
                        пациенте
                    </button>
                    <button className="fm-button" onClick={() => setParamModalOpen(true)}
                            disabled={!analysisStats}>
                        Статистический анализ
                    </button>
                </footer>
            </div>

            <UploadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />

            <ParamModal
                isOpen={paramModalOpen}
                onClose={() => setParamModalOpen(false)}
                analysisStats={analysisStats || undefined}
            />
            {patientId && (
                <MonInfo
                    isOpen={patInfo}
                    onClose={() => setPatInfo(false)}
                    patientId={patientId as string}
                />
            )}
            <HRTSettingsModal
                isOpen={isDangerModalOpen}
                initialMinHRT={hrtThresholds.min}
                initialMaxHRT={hrtThresholds.max}
                initialVolume={hrtThresholds.volume}
                currentHRT={currentHR}
                onClose={() => setIsDangerModalOpen(false)}
                onSave={(min, max, vol) => setHrtThresholds({ min, max, volume: vol })}
            />

            <NextPartModal
                isOpen={isNextModalOpen}
                onNext={handleNextPart}
            />
        </>
    );
}