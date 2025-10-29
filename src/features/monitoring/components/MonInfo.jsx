'use client'
import React, {useCallback, useEffect, useState} from "react";
import EditPatientModal from "@/features/patients/components/EditPatientModal";
import { apiUrl } from "@/shared/api/api";
import "@/shared/ui/Modal.css";

const MonInfo = ({patientId, onClose, isOpen}) => {
    const [patient, setPatient] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fetchPatientData = useCallback(async () => {
        if (!patientId) {
            console.warn("patientId не определен. Пропуск загрузки данных.");
            return;
        }

        try {
            const response = await fetch(apiUrl(`/v1/patients/${patientId}`));

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            const data = await response.json();
            setPatient(data);

        } catch (error) {
            console.error("Ошибка при получении данных пациента:", error);
            setPatient(null);
        }
    }, [patientId]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        fetchPatientData();
    };


    useEffect(() => {
        if (isOpen && patientId) {
            fetchPatientData();
        }
    }, [patientId, isOpen, fetchPatientData]);

    if (!isOpen) { return null }

    return (
        <div className='modal-overlay' onClick={onClose}>
            <div
                className="modal-content patient-info-modal"
                onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <h3 className="modal-title">Информация о пациенте</h3>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </header>

                {patient ? (
                    <div className="patient-modal-body">

                        <p className="modal-patient-name">{patient?.name || `Фамилия Имя Отчество ID: ${patient?.id}`}</p>

                        <div className="modal-details-group">
                            <div className="modal-patient-detail"><p>Паритет родов:</p> <span>{patient?.info?.parity || 'Нет данных'}</span></div>
                            <div className="modal-patient-detail"><p>Соматические заболевания: </p><span>{patient?.info?.somatic_diseases || 'Нет данных'}</span>
                            </div>
                            <div className="modal-patient-detail"><p>Течение беременности: </p><span>{patient?.info?.pregnancy_course || 'Нет данных'}</span>
                            </div>
                            <div className="modal-patient-detail"><p>Последняя менструация: </p> <span>{patient?.info?.last_menstrual_period || 'Нет данных'}</span></div>
                        </div>

                        <div className="modal-bga-section">
                            <h3 className="modal-section-title">Показатели газа в крови</h3>
                            <table className="modal-bga-table">
                                <thead>
                                <tr>
                                    <th>Показатель</th>
                                    <th>Значение</th>
                                    <th>Ед. изм.</th>
                                    <th>Норма</th>
                                </tr>
                                </thead>
                                <tbody>
                                {patient?.info?.blood_gas?.length > 0 ? (
                                    patient.info.blood_gas.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item?.name}</td>
                                            <td>{item?.value}</td>
                                            <td>{item?.unit}</td>
                                            <td>{item?.normal}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="empty-table-cell">Нет данных по газу в крови.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="modal-loading">Загрузка данных пациента...</div>
                )}
            </div>
            {isModalOpen && (
                <EditPatientModal
                    isOpen={isModalOpen}
                    onSuccess={handleModalClose}
                    onClose={() => setIsModalOpen(false)}
                    patientData={patient}
                />
            )}
        </div>
    )
}

export default MonInfo;
