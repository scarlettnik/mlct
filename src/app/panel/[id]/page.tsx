'use client'

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    ChartOptions,
    ChartData,
    Scale,
    Tick,
} from "chart.js";
import { Line } from "react-chartjs-2";
import './style.css'
import annotationPlugin from 'chartjs-plugin-annotation';
import ReportBlock from "@/features/reports/components/ReportBlock";
import ChartSelector, { SelectedChart } from "@/features/charts/components/ChartSelector";
import PatientInfo from "@/features/patients/components/PatientInfo";
import { useParams, useRouter } from "next/navigation";
import { apiUrl } from "@/shared/api/api";
import { formatTimeMMSS } from "@/shared/lib/formatters";
import type { Patient, Examination } from "@/shared/api/types";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    annotationPlugin
);

interface DataPoint {
    time_sec: number;
    value: number;
}

const transformChartData = (jsonArr: any[]): DataPoint[] => {
    if (!Array.isArray(jsonArr)) return [];

    return jsonArr
        .filter(item => item && item.length === 2 && typeof item[0] === 'number' && typeof item[1] === 'number')
        .map(item => ({
            time_sec: item[0],
            value: item[1]
        }));
};

interface ExaminationDataState {
    part: {
        data: {
            bpm: any[];
            uterus: any[];
        };
        intervals?: Array<{
            start: number;
            end: number;
            message: string;
        }>;
        id?: number;
        metadata?: any;
    };
    exam: Examination | null;
}

export default function FetalMonitor() {
    const router = useRouter();
    const params = useParams();
    const patientId = params?.id as string;

    const hrLoading = false;
    const toneLoading = false;
    const hrChartRef = useRef<ChartJS<"line">>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isPatientDataLoading, setIsPatientDataLoading] = useState(true);
    const [patientFetchError, setPatientFetchError] = useState<string | null>(null);

    const [patientData, setPatientData] = useState<Patient>({ id: 0 });

    const [currentChartId, setCurrentChartId] = useState<number | null>(null);
    const [selectedExaminationData, setSelectedExaminationData] = useState<ExaminationDataState>({
        part: { data: { bpm: [], uterus: [] } },
        exam: null
    });
    const [selectedExaminationDetails, setSelectedExaminationDetails] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const heartRateData = useMemo(() => {
        const bpmData = selectedExaminationData.part?.data?.bpm;
        return transformChartData(bpmData);
    }, [selectedExaminationData.part]);

    const toneData = useMemo(() => {
        const uterusData = selectedExaminationData.part?.data?.uterus;
        return transformChartData(uterusData);
    }, [selectedExaminationData.part]);

    const selectChart = useCallback((chartId: SelectedChart, partData: any, examData: any) => {
        setCurrentChartId(chartId.examinationId);
        const safePartData = partData?.data ? partData : { data: { bpm: [], uterus: [] } };
        setSelectedExaminationData({ part: safePartData, exam: examData });
        setSelectedExaminationDetails(partData);
    }, []);

    const patientDataId = patientData.id;
    const patientDataUnread = patientData.misc_data?.unread;

    const fetchPatientData = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) {
            setIsPatientDataLoading(true);
        }
        setPatientFetchError(null);

        if (!patientId) {
            console.warn("patientId не определен. Пропуск загрузки данных.");
            if (isInitialLoad) setIsPatientDataLoading(false);
            return;
        }

        try {
            const response = await fetch(apiUrl(`/v1/patients/${patientId}`));

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            const data: Patient = await response.json();

            setPatientData(data);
            if (isInitialLoad && data.examinations && data.examinations.length > 0) {
                const firstExam = data.examinations[0];
                setCurrentChartId(firstExam.id);
                setSelectedExaminationData({
                    part: { data: { bpm: [], uterus: [] } },
                    exam: firstExam
                });
            }
            if (isInitialLoad) {
                setFreeComment(data.comment || '');
                setIsCommentLoading(false);
            }

        } catch (error: any) {
            console.error("Ошибка при получении данных пациента:", error);
            setPatientFetchError(`Не удалось загрузить данные пациента: ${error.message}`);
        } finally {
            if (isInitialLoad) {
                setIsPatientDataLoading(false);
            }
        }
    }, [patientId]);

    useEffect(() => {
        if (patientDataId && patientDataUnread) {
            const patchUnreadStatus = async () => {
                try {
                    const response = await fetch(apiUrl(`/v1/patients/${patientDataId}`), {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            misc_data: {
                                unread: false
                            }
                        })
                    });

                    if (!response.ok) {
                        console.warn(`Не удалось обновить статус 'unread' для ${patientDataId}: ${response.status}`);
                    }

                    setPatientData(prevData => ({
                        ...prevData,
                        misc_data: {
                            ...prevData.misc_data,
                            unread: false
                        }
                    }));

                } catch (error) {
                    console.error("Ошибка при отправке PATCH-запроса для unread:", error);
                }
            };

            patchUnreadStatus();
        }
    }, [patientDataId, patientDataUnread]);

    const [freeComment, setFreeComment] = useState('Ожидание загрузки комментария...');
    const [isCommentLoading, setIsCommentLoading] = useState(true);

    useEffect(() => {
        fetchPatientData(true);
    }, [fetchPatientData]);

    const handleSaveComment = useCallback(async () => {
        if (!patientId || isSaving) return;

        setIsSaving(true);
        try {
            await fetch(apiUrl(`/v1/patients/${patientId}`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: freeComment })
            });
        } catch (error) {
            console.error("Ошибка при сохранении комментария:", error);
        } finally {
            setIsSaving(false);
        }
    }, [patientId, freeComment, isSaving]);

    const dynamicAnnotations = useMemo(() => {
        if (!selectedExaminationDetails?.intervals) return [];
        return selectedExaminationDetails.intervals.map((int: any, idx: number) => ({
            id: `interval-${idx}`,
            title: `Интервал ${idx + 1}`,
            description: int.message,
            xMin: int.start,
            xMax: int.end,
        }));
    }, [selectedExaminationDetails]);

    const makeBoxAnnotations = (annots: any[]) =>
        Object.fromEntries(
            annots.map((a) => [
                a.id,
                {
                    type: "box",
                    xMin: a.xMin,
                    xMax: a.xMax,
                    yMin: "start",
                    yMax: "end",
                    backgroundColor: "rgba(255, 100, 150, 0.3)",
                    borderWidth: 1,
                    drawTime: "beforeDatasetsDraw",
                },
            ])
        );

    const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);
    const [selectedAnnotation, setSelectedAnnotation] = useState<any>(null);

    const { sortedHR, sortedUC, xMin, xMax } = useMemo(() => {
        const hr = Array.isArray(heartRateData) ? [...heartRateData] : [];
        const uc = Array.isArray(toneData) ? [...toneData] : [];

        hr.sort((a, b) => (a.time_sec || 0) - (b.time_sec || 0));
        uc.sort((a, b) => (a.time_sec || 0) - (b.time_sec || 0));

        const allTimes = [
            ...hr.map((d) => Number(d.time_sec ?? 0)),
            ...uc.map((d) => Number(d.time_sec ?? 0)),
        ].filter((t) => !Number.isNaN(t));

        const min = allTimes.length ? Math.min(...allTimes) : 0;
        const max = allTimes.length ? Math.max(...allTimes) : Math.max(60, min + 60);

        return { sortedHR: hr, sortedUC: uc, xMin: min, xMax: max };
    }, [heartRateData, toneData]);

    useEffect(() => {
        if (xMax > xMin && (zoomRange === null || zoomRange[1] !== xMax)) {
            setZoomRange([xMin, xMax]);
        }
    }, [xMin, xMax, zoomRange]);

    const handleChartClick = useCallback((event: any, elements: any[], chart: any) => {
        if (!chart) {
            setSelectedAnnotation(null);
            return;
        }

        const nativeEvent = event.native;
        const rect = chart.canvas.getBoundingClientRect();
        const clickX = nativeEvent.clientX - rect.left;
        const xValue = chart.scales.x.getValueForPixel(clickX);

        const hit = dynamicAnnotations.find(
            (a: any) => xValue >= a.xMin && xValue <= a.xMax
        );

        setSelectedAnnotation(hit);
    }, [dynamicAnnotations]);

    const isExaminationSelected = currentChartId !== null;
    const hasHRData = sortedHR.length > 0;
    const hasUCData = sortedUC.length > 0;

    if (patientFetchError) {
        return (
            <div className="loading-screen">
                <p className="error-state-text">{patientFetchError}</p>
            </div>
        );
    }

    if (isPatientDataLoading) {
        return (
            <div className="loading-screen">
                <p>Загрузка данных пациента...</p>
            </div>
        );
    }

    let chartPlaceholderText: string | null = null;

    if (!isExaminationSelected) {
        chartPlaceholderText = "Выберите исследование";
    } else if (zoomRange === null) {
        chartPlaceholderText = "Загрузка данных графика...";
    }

    const chartPlaceholder = chartPlaceholderText ? (
        <p className="chart-status-text">{chartPlaceholderText}</p>
    ) : null;

    const baseX: any = {
        type: "linear",
        min: xMin,
        max: xMax,
        ticks: {
            color: "black",
            stepSize: 1,
            autoSkip: true,
            callback: (value: number) => {
                const v = Math.round(value);
                return formatTimeMMSS(v);
            },
        },
        grid: {
            color: "rgba(0, 0, 0, 0.3)",
            borderDash: [2, 2],
        },
    };

    const createOptions = (yScaleConfig: any, annotations: any[]): ChartOptions<"line"> => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        onClick: (event, elements, chart) => handleChartClick(event, elements, chart),
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            annotation: {
                annotations: makeBoxAnnotations(annotations),
            } as any,
        },
        scales: {
            x: baseX,
            y: yScaleConfig,
        },
    });

    const hrOptions = createOptions(
        {
            min: 70,
            max: 230,
            ticks: { color: "black", stepSize: 20 },
            grid: { color: "rgba(0, 0, 0, 0.3)" },
        },
        dynamicAnnotations
    );

    const ucOptions = createOptions(
        {
            min: 0,
            max: 100,
            ticks: { color: "black", stepSize: 10 },
            grid: { color: "rgba(0, 0, 0, 0.3)" },
        },
        dynamicAnnotations
    );

    const hrDataset: ChartData<"line"> = {
        datasets: [{
            label: "ЧСС плода",
            data: sortedHR.map((d) => ({ x: Number(d.time_sec), y: Number(d.value) })),
            borderColor: "lime",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0,
            spanGaps: true,
        }],
    };

    const ucDataset: ChartData<"line"> = {
        datasets: [{
            label: "Схватки (UC)",
            data: sortedUC.map((d) => ({ x: Number(d.time_sec), y: Number(d.value) })),
            borderColor: "blue",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0,
            spanGaps: true,
        }],
    };

    const handleConnect = () => {
        if (patientData?.ongoing_examination_id) {
            const examinationId = patientData.ongoing_examination_id;
            const patientIdToPass = patientData.id;
            const url = `/streaming/${patientIdToPass}/${examinationId}`;
            router.push(url);
        }
    };

    const renderMetadata = (metadata: any) => {
        if (!metadata) return <p>Метаданные отсутствуют.</p>;

        return (
            <div className="metadata-list">
                {Object.entries(metadata).map(([key, value]) => (
                    <p key={key}>
                        <strong>{key.replace(/_/g, ' ')}:</strong> {value !== null && value !== undefined ? String(value) : 'N/A'}
                    </p>
                ))}
            </div>
        );
    };

    const currentReportData = patientData.last_verdict
    return (
        <div className="fetal-monitor-container" ref={containerRef}>
            <header className="fm-header bento-box bento-header">
                <div className="fm-header-row">
                    <div>
                        <h1 className="fm-title">Кардиотокография</h1>
                        <p className="fm-header-caption">Карта пациента, архив записей и клиническое заключение</p>
                    </div>
                    {patientData?.ongoing_examination_id && (
                        <button onClick={handleConnect} className="fm-action-button">
                            Подключиться к трансляции
                        </button>
                    )}
                </div>
                <div className="fm-info-time">{new Date().toLocaleString()}</div>
            </header>

            <main className="fm-main-content">
                <PatientInfo patient={patientData} onDataUpdate={() => fetchPatientData(false)}/>

                <ReportBlock reportData={selectedExaminationData?.exam as any}/>

                <div className="bento-box fm-graph fm-graph-hr">
                    <div className="chart-wrapper">
                        {chartPlaceholder ? chartPlaceholder : (
                            hasHRData ?
                                <Line ref={hrChartRef} options={hrOptions} data={hrDataset}/> :
                                <p className="chart-status-text">Для просмотра графика выберите исследование, обработка
                                    может занять несколько секунд</p>
                        )}
                    </div>
                </div>

                <div className="bento-box fm-graph fm-graph-uc">
                    <div className="chart-wrapper">
                        {chartPlaceholder ? chartPlaceholder : (
                            hasUCData ?
                                <>
                                    <h2 className="fm-subtitle">Частота маточных сокращений</h2>
                                    <Line options={ucOptions} data={ucDataset}/></> :
                                <p className="chart-status-text">Для просмотра графика выберите исследование, обработка
                                    может занять несколько секунд</p>
                        )}
                    </div>
                </div>

                <div className="fm-store">
                    <ChartSelector
                        patient={patientData}
                        currentChartId={currentChartId}
                        selectChart={selectChart}
                        data={heartRateData}
                        loading={hrLoading || toneLoading}
                    />
                </div>

                <div className="bento-box fm-result">
                    <div className="recommendation-panel">
                        <h3 className="fm-subtitle">РЕКОМЕНДАЦИИ:</h3>
                        {currentReportData?.recommendations && currentReportData?.recommendations?.length > 0 ? (
                            <ul className="clinical-list">
                                {currentReportData?.recommendations?.map((item: string, index: number) => (
                                    <li key={`rec-${index}`}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>Нет актуальных рекомендаций.</p>
                        )}

                        <br/>
                        <h3 className="fm-subtitle">ЗОНЫ РИСКА:</h3>
                        {currentReportData?.risk_zones && currentReportData?.risk_zones?.length > 0 ? (
                            <ul className="clinical-list">
                                {currentReportData?.risk_zones.map((item: string, index: number) => (
                                    <li key={`risk-${index}`}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>Зоны риска не выявлены.</p>
                        )}

                        <br/>
                        <h3 className="fm-subtitle">ЧТО В НОРМЕ:</h3>
                        {currentReportData?.what_in_norm && currentReportData?.what_in_norm?.length > 0 ? (
                            <ul className="clinical-list">
                                {currentReportData?.what_in_norm?.map((item: string, index: number) => (
                                    <li key={`norm-${index}`}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>Нет информации о параметрах в норме.</p>
                        )}

                    </div>
                </div>
                <div className='bento-box fm-comment'>
                    <div className="comment-panel">
                        <h4>Комментарий врача</h4>

                        <textarea
                            value={isCommentLoading ? 'Загрузка...' : freeComment}
                            onChange={(e) => setFreeComment(e.target.value)}
                            disabled={isCommentLoading || isSaving}
                            rows={6}
                            placeholder="Введите здесь свой комментарий..."
                            className="doctor-comment-textarea"
                            />

                        <button
                            onClick={handleSaveComment}
                            disabled={isCommentLoading}
                            className="fm-action-button comment-save-button"
                        >
                            {isSaving ? 'Сохранение...' : 'Сохранить комментарий'}
                        </button>
                    </div>
                </div>
                <div className='fm-predict bento-box'>
                    <h2 className="fm-subtitle">Информация по выделенной области</h2>

                    {selectedAnnotation ? (
                        <>
                            <h3 className="annotation-title">{selectedAnnotation.title}</h3>
                            <p className="annotation-description">{selectedAnnotation.description}</p>
                        </>
                    ) : (
                        <p className="annotation-placeholder">
                            Чтобы увидеть детальное описание, кликните на выделенную розовым область на
                            графиках.
                        </p>
                    )}

                    <hr className="section-divider"/>
                    <h2 className="fm-subtitle">Детали выбранной записи</h2>
                    {selectedExaminationDetails ? (
                        <>
                            <p><strong>ID исследования:</strong> {selectedExaminationDetails.id}</p>
                            <p><strong>Метаданные:</strong></p>
                            {renderMetadata(selectedExaminationDetails.metadata)}
                        </>
                    ) : (
                        <p>Детали исследования появятся после выбора записи в левой панели.</p>
                    )}
                </div>
            </main>
        </div>
    );
}
