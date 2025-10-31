"use client";

import React from 'react';

interface NextPartModalProps {
    isOpen: boolean;
    onNext: () => void;
}

export default function NextPartModal({ isOpen, onNext }: NextPartModalProps): React.ReactNode {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Ожидание команды</h2>
                <p>Сервер ждёт подтверждения, чтобы отправить следующую часть данных.</p>
                <button className="fm-button" onClick={onNext}>
                    Следующая часть
                </button>
            </div>
        </div>
    );
}
