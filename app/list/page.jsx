'use client';

import Link from 'next/link';
import './styles.css';
import useUsers from "@/app/api/Patients";
import React, {useState} from "react";
import EditPatientModal from "@/app/components/EditPatientModal";

const ArrowRight = () => (
    <svg
        className="arrow-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const getStateClass = (state) => {
    if (state === "требуется внимание") return "state-warning";
    if (state === "стабильное состояние") return "state-stable";
    return "state-critical";
};

const UserBentoCard = ({ user }) => {
    const hasName = Boolean(user?.misc_data?.name);
    const displayName = user?.misc_data?.name || `Фамилия Имя Отчество ${user.id}`;
    const stateClass = getStateClass(user?.misc_data?.overall_state);

    return (
        <Link href={`/panel/${user?.id}`} passHref>
            <div
                className={`bento-card ${hasName ? 'status-completed' : 'status-pending'}`}
            >
                <div className="card-info">
                    <div className="card-header">
                        <div className="user-avatar">
                            {user?.misc_data?.name?.charAt(0) || '0'}
                        </div>
                        <h3 className="user-name">{displayName}</h3>
                    </div>

                    <p className={`user-status ${hasName ? 'text-completed' : 'text-pending'}`}>
                        {hasName ? "Данные заполнены" : "Данные не заполнены"}
                    </p>
                </div>
                {user?.misc_data?.unread && <div className={`status-dot ${stateClass}`} />}
                <div className="card-arrow-container">
                    <ArrowRight/>
                </div>
            </div>
        </Link>
    );
};

const BentoUserList = () => {
    const {users, isLoading, error, refetch} = useUsers();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handlePatientSaveSuccess = () => {
        setIsModalOpen(false);
        refetch();
    };
    if (isLoading) {
        return (
            <div className="bento-grid-container">
                <h2 className="grid-title">Пациенты</h2>
                <div className="bento-list">
                    <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>

                    <p className="loading-state">Загрузка пациентов...</p>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="bento-grid-container">
                <h2 className="grid-title">Пациенты</h2>
                <div className="bento-list">
                    <p className="error-state">Ошибка загрузки: {error.message}</p>
                </div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="bento-grid-container">
                <h2 className="grid-title">Пациенты</h2>
                <div className="bento-list">
                    <p className="empty-state">Пациенты не найдены.</p>
                </div>
            </div>
        );
    }

    return ( <>
        <div className="bento-grid-container">
            <div className="list-toolbar">
                <div>
                    <h2 className="grid-title">Пациенты</h2>
                    <p className="grid-subtitle">Выберите карту пациента для просмотра КТГ и заключений.</p>
                </div>
                <button
                    className="edit-button add-patient-button"
                    onClick={() => setIsModalOpen(true)}
                >
                    Добавить пациента
                </button>
            </div>
            <button
                className="edit-button add-patient-button mobile-add-button"
                onClick={() => setIsModalOpen(true)}
            >
                Добавить пациента
            </button>
            <div className="bento-list">
                {users.map((user, index) => (
                    <UserBentoCard
                        key={user.id}
                        user={user}
                    />
                ))}
            </div>
        </div>
            {isModalOpen && (
                <EditPatientModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    successAdd = {handlePatientSaveSuccess}
                />
            )}
        </>
    );
};

export default BentoUserList;
