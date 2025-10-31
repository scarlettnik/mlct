'use client';

import React, {useState, useEffect, useId, type JSX} from "react";
import CreatableSelect from "react-select/creatable";
import type { SingleValue } from "react-select";
import "./UploadModal.css";
import VirtualKeyboard from "@/shared/ui/VirtualKeyBoard";
import { apiUrl } from "@/shared/api/api";
import type { Patient } from "@/shared/api/types";

interface PatientOption {
    value: string;
    label: string;
    patientData?: Patient;
    __isNew__?: boolean;
}

const fetchPatients = async (): Promise<PatientOption[]> => {
    try {
        const url = apiUrl("/v1/patients");
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            const patientsArray: Patient[] = data?.items || [];

            if (!Array.isArray(patientsArray)) {
                console.error("API response error: 'items' is not an array.", data);
                return [];
            }

            return patientsArray.map((patient: Patient) => ({
                value: String(patient.id).trim(),
                label: `ID: ${patient.id} - ${patient.name || 'Неизвестно'}`,
                patientData: patient
            }));
        } else {
            console.error("Ошибка при получении списка пациентов:", response);
            return [];
        }
    } catch (error) {
        console.error("Fetch error при получении списка пациентов:", error);
        return [];
    }
};

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess?: (patientId: string, data: any) => void;
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps): JSX.Element | null {
    const [patientId, setPatientId] = useState<string>("");
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");
    const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);
    const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(false);
    const selectInstanceId = useId();
    const isKeyboardVisible = true;

    useEffect(() => {
        if (isOpen) {
            const loadPatients = async () => {
                setIsLoadingPatients(true);
                const options = await fetchPatients();
                setPatientOptions(options);
                setIsLoadingPatients(false);
            };
            loadPatients();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePatientSelectChange = (selectedOption: SingleValue<PatientOption>) => {
        if (!selectedOption) {
            setPatientId("");
            return;
        }

        let newPatientId = selectedOption.value;
        if (selectedOption.__isNew__) {
            newPatientId = newPatientId.trim();
        }

        setPatientId(newPatientId);
    };

    const handlePatientIdChangeFromKeyboard = (newVal: string) => {
        setPatientId(newVal ? newVal.trim() : "");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage("");
        const trimmedPatientId = patientId.trim();

        if (!trimmedPatientId || !zipFile) {
            setMessage("Пожалуйста, заполните ID пациента и выберите файл.");
            return;
        }
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("file", zipFile, zipFile.name);
        const url = apiUrl(`/v1/patients/${trimmedPatientId}/examinations`);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                },
                body: formData
            });

            if (response.ok) {
                const successData = await response.json();

                if (onUploadSuccess) {
                    onUploadSuccess(trimmedPatientId, successData);
                }

                setPatientId("");
                setZipFile(null);
                setMessage("Данные успешно загружены.");
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.detail || "Ошибка загрузки данных на сервер.";
                setMessage(`Ошибка: ${errorMessage}`);
                console.error("Server error:", errorData);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setMessage("Произошла ошибка сети или сервера.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const cleanedPatientId = patientId.trim();

    const selectedPatientOption: PatientOption | null = cleanedPatientId
        ? patientOptions.find(option => option.value === cleanedPatientId) || { value: cleanedPatientId, label: cleanedPatientId }
        : null;

    const isValidNewPatientId = (inputValue: string) => {
        return inputValue.trim().length > 0;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Загрузите ZIP-файл</h2>
                {message && <p className="message-status">{message}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="patientSelect">Выберите или введите ID пациента:</label>
                        <CreatableSelect<PatientOption>
                            id="patientSelect"
                            options={patientOptions}
                            value={selectedPatientOption}
                            onChange={handlePatientSelectChange}
                            instanceId={selectInstanceId}
                            isLoading={isLoadingPatients}
                            isClearable={true}
                            isValidNewOption={isValidNewPatientId}
                            formatCreateLabel={(inputValue) => `Использовать ID: "${inputValue.trim()}"`}
                            placeholder={isLoadingPatients ? "Загрузка пациентов..." : "Введите или выберите ID..."}
                            classNamePrefix="patient-select"
                            required
                        />
                    </div>

                    {isKeyboardVisible && (
                        <VirtualKeyboard
                            onKeyPress={handlePatientIdChangeFromKeyboard}
                            targetValue={patientId}
                        />
                    )}

                    <div className="form-group">
                        <label htmlFor="zipFile">Загрузить ZIP-архив:</label>
                        <input
                            id="zipFile"
                            type="file"
                            accept=".zip"
                            onChange={(e) => setZipFile(e.target.files ? e.target.files[0] : null)}
                            required
                            className="input-file"
                        />
                    </div>
                    <div className="button-group">
                        <button type="submit" disabled={isSubmitting || !cleanedPatientId} className="btn-submit">
                            {isSubmitting ? "Отправка..." : "Отправить данные"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
