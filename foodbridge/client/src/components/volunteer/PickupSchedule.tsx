import React, { useEffect, useState } from 'react';
import { fetchPickupSchedules } from '../../services/api';
import { PickupScheduleType } from '../../types';

const PickupSchedule: React.FC = () => {
    const [schedules, setSchedules] = useState<PickupScheduleType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSchedules = async () => {
            try {
                const data = await fetchPickupSchedules();
                setSchedules(data);
            } catch (err) {
                setError('Failed to load pickup schedules');
            } finally {
                setLoading(false);
            }
        };

        loadSchedules();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h2>Pickup Schedules</h2>
            <ul>
                {schedules.map(schedule => (
                    <li key={schedule.id}>
                        <strong>{schedule.date}</strong>: {schedule.location} - {schedule.details}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PickupSchedule;