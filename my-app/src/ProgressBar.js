// src/ProgressBar.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ProgressBar = () => {
    const [step, setStep] = useState(1); // Estado para controlar el paso actual
    const steps = [
        { label: 'Solicitado', value: 1 },
        { label: 'Asignado', value: 2 },
        { label: 'En camino', value: 3 },
        { label: 'Recolectado', value: 4 },
    ];

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0' }}>
        {steps.map((s, index) => (
            <div key={index} style={{ position: 'relative', textAlign: 'center', flex: 1 }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={step >= s.value ? { scale: 1, opacity: 1, backgroundColor: '#4caf50' } : { scale: 0.8, opacity: 0.5, backgroundColor: '#ccc' }}
                transition={{ duration: 0.5 }}
                style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                margin: '0 auto',
                backgroundColor: '#ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                position: 'relative',
                }}
            >
                {step >= s.value && <motion.span animate={{ scale: 1.2 }} transition={{ yoyo: Infinity }}>&#10003;</motion.span>}
            </motion.div>
            <span style={{ marginTop: '10px', display: 'block' }}>{s.label}</span>
            {index < steps.length - 1 && (
                <motion.div
                initial={{ width: 0 }}
                animate={{ width: step > s.value ? '100%' : '0%' }}
                transition={{ duration: 0.5 }}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '100%',
                    height: '4px',
                    backgroundColor: '#4caf50',
                    zIndex: 1,
                }}
                />
            )}
            </div>
        ))}
        <button onClick={() => setStep((prev) => (prev < steps.length ? prev + 1 : prev))}>
            Siguiente paso
        </button>
    </div>
    );
};

export default ProgressBar;
