import Link from 'next/link';
import styles from './start/styles.module.css';

const features = [
    {
        title: "Мониторинг КТГ",
        description: "Поток ЧСС плода и маточной активности с выделением подозрительных интервалов.",
        className: `${styles.size2x2} ${styles.bentoBlock} ${styles.demoBlock}`,
        icon: "CTG"
    },
    {
        title: "Начать симуляцию",
        description: "Загрузить запись и перейти к мониторингу.",
        className: `${styles.size2x2} ${styles.buttonCard}`,
        href: "/mon",
        isPrimary: true,
        icon: "01"
    },
    {
        title: "Анализ кейсов",
        description: "Открыть список пациентов и завершенные исследования.",
        className: `${styles.size2x2} ${styles.buttonCard}`,
        href: "/list",
        isSecondary: true,
        icon: "02"
    },
    {
        title: "Клинический контекст",
        description: "Карточка пациента, анамнез, показатели газа крови и комментарий врача рядом с графиками.",
        className: `${styles.size2x1} ${styles.bentoBlock}`,
        icon: "HX"
    },
    {
        title: "Удаленный доступ",
        description: "Подключение к активной трансляции исследования без потери текущего состояния.",
        className: `${styles.size2x1} ${styles.bentoBlock}`,
        icon: "WS"
    },
    {
        title: "Риски",
        description: "Система показывает зоны внимания и прогноз по мере поступления данных.",
        className: `${styles.size1x1} ${styles.bentoBlock}`,
        icon: "R"
    },
    {
        title: "Отчет",
        description: "Средние значения, акцелерации, децелерации и статус исследования в одном блоке.",
        className: `${styles.size1x1} ${styles.bentoBlock}`,
        icon: "PDF"
    },
    {
        title: "Данные",
        description: "Загрузка ZIP-архива и быстрый выбор пациента для симуляции.",
        className: `${styles.size1x1} ${styles.bentoBlock}`,
        icon: "ZIP"
    },
    {
        title: "Фокус",
        description: "Выделенные сегменты на графиках раскрывают описание по клику.",
        className: `${styles.size1x1} ${styles.bentoBlock}`,
        icon: "AI"
    },
];

const FeatureCard = ({ title, description, className, icon, href, isPrimary, isSecondary, component: Component }) => {
    if (Component) {
        return (
            <div className={className}>
                <h3 className={styles.featureTitle}>{title}</h3>
                <p className={styles.featureDescription}>{description}</p>
                <Component />
            </div>
        );
    }

    if (href) {
        const buttonClass = isPrimary ? styles.primaryButton : styles.secondaryButton;

        return (
            <Link href={href} className={`${className} ${buttonClass}`}>
                <div className={styles.icon}>{icon}</div>
                <h3 className={styles.buttonTitle}>{title}</h3>
                <p className={styles.buttonDescription}>{description}</p>
            </Link>
        );
    }

    return (
        <div className={className}>
            <div className={styles.icon}>{icon}</div>
            <h3 className={styles.featureTitle}>{title}</h3>
            <p className={styles.featureDescription}>{description}</p>
        </div>
    );
};

const FetalMonitorShowcase = () => {
    return (
        <div className={styles.showcaseContainer}>

            <header className={styles.header}>
                <h1 className={styles.title}>
                    КТГ рабочая станция
                </h1>
                <p className={styles.subtitle}>
                    Симуляция, мониторинг и разбор клинических кейсов в одном интерфейсе.
                </p>
            </header>
            <div className={styles.bentoGrid}>
                {features.map((feature, index) => (
                    <FeatureCard key={index} {...feature} />
                ))}

            </div>

        </div>
    );
};

export default FetalMonitorShowcase;
