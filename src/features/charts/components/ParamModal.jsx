import React from 'react';
import "@/shared/ui/Modal.css";
import './Param.css'

const ParamModal = ({ isOpen, onClose, analysisStats }) => {
    const secondsToMinutes = (seconds) => {
        return (seconds / 60).toFixed(2);
    };

    const reportData = {
        avgBaselineFHR: analysisStats?.bpm_average,
        ucFrequency: analysisStats?.uterus_average,
        accelFrequency: analysisStats?.acceleration_count,
        decelFrequency: analysisStats?.deceleration_count,
        lateDecels: analysisStats?.late_deceleration_count,
        earlyDecels: analysisStats?.early_deceleration_count,
        variableDecels: analysisStats?.variable_deceleration_count,
        pathologyStatus: analysisStats?.condition || "Нормальное",
        tachycardiaModerateTime: secondsToMinutes(analysisStats?.mild_tachycardia_seconds || 0),
        tachycardiaSevereTime: secondsToMinutes(analysisStats?.severe_tachycardia_seconds || 0),
        bradycardiaModerateTime: secondsToMinutes(analysisStats?.mild_bradycardia_seconds || 0),
        bradycardiaSevereTime: secondsToMinutes(analysisStats?.severe_bradycardia_seconds || 0),
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content param-modal-content"
                onClick={e => e.stopPropagation()}
            >
                <header className="modal-header">
                    <h3 className="modal-title">Анализ мониторинга</h3>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </header>
                <div className="param-report-body">
                    <div>
                        <header className="param-report-header">
                            <h2 className="fm-subtitle">Отчет</h2>
                        </header>
                        <div className="report-metric">
                            Среднее значение базовой ЧСС:
                            <span className="metric-value">{reportData.avgBaselineFHR} уд</span>
                        </div>

                        <div className="report-metric">
                            Количество маточных сокращений (частота):
                            <span className="metric-value">{reportData.ucFrequency}</span>
                        </div>

                        <div className="report-metric">
                            Количество Акцелераций:
                            <span className="metric-value">{reportData.accelFrequency}</span>
                        </div>

                        <div className="report-metric">
                            Количество Децелераций:
                            <span className="metric-value">{reportData.decelFrequency}</span>
                        </div>

                        <div className="report-submetric">Поздние Децелерации:
                            <span className="metric-value">{reportData.lateDecels}</span>
                        </div>
                        <div className="report-submetric">Ранние Децелерации:
                            <span className="metric-value">{reportData.earlyDecels}</span>
                        </div>
                        <div className="report-submetric">Вариабельные Децелерации:
                            <span className="metric-value">{reportData.variableDecels}</span>
                        </div>

                        <div className={`report-pathology-status`}>
                            <span className="pathology-label">Статус:</span>
                            <span className={`pathology-value `}>{reportData.pathologyStatus || 'Норма'}</span>
                        </div>
                        <div className="report-metric time-metric">
                            Тахикардия:
                            <div className="time-submetric"> умеренная: <span
                                className="metric-value">{reportData.tachycardiaModerateTime} мин.</span></div>
                            <div className="time-submetric">выраженная: <span
                                className="metric-value">{reportData.tachycardiaSevereTime} мин.</span></div>
                        </div>
                        <div className="report-metric time-metric">
                            Брадикадия:
                            <div className="time-submetric">умеренная: <span
                                className="metric-value">{reportData.bradycardiaModerateTime} мин.</span></div>
                            <div className="time-submetric">выраженная: <span
                                className="metric-value">{reportData.bradycardiaSevereTime} мин.</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParamModal;
