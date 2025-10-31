export interface PatientInfo {
    parity?: string;
    pregnancy_course?: string;
    last_menstrual_period?: string;
    somatic_diseases?: string;
    blood_gas?: BloodGasItem[];
}

export interface BloodGasItem {
    name: string;
    value: number | string;
    unit?: string;
    normal?: string;
}

export interface Examination {
    id: number;
    metadata: {
        date: string;
        part_count?: number;
        [key: string]: any;
    };
    stats?: ExaminationStats;
}

export interface ExaminationStats {
    bpm_average: number;
    uterus_average: number;
    acceleration_count: number;
    deceleration_count: number;
    late_deceleration_count: number;
    early_deceleration_count: number;
    variable_deceleration_count: number;
    condition: string;
    mild_tachycardia_seconds?: number;
    severe_tachycardia_seconds?: number;
    mild_bradycardia_seconds?: number;
    severe_bradycardia_seconds?: number;
}

export interface Patient {
    id: number;
    name?: string;
    info?: PatientInfo;
    examinations?: Examination[];
    ongoing_examination_id?: number;
    comment?: string;
    misc_data?: {
        unread?: boolean;
        [key: string]: any;
    };
    last_verdict?: {
        recommendations: string[];
        risk_zones: string[];
        what_in_norm: string[];
    };
}
