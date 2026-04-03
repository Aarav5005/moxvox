import React, { useState, useEffect } from "react";
import { split24Hour, convertTo24Hour } from "../lib/timeUtils";

interface TimePickerProps {
  id: string;
  value: string; // Internal 24h format "HH:mm"
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({ id, value, onChange, className, disabled }: TimePickerProps) {
  const { hour, minute, period } = split24Hour(value);

  const [h, setH] = useState(hour);
  const [m, setM] = useState(minute);
  const [p, setP] = useState(period);

  useEffect(() => {
    const { hour: newH, minute: newM, period: newP } = split24Hour(value);
    setH(newH);
    setM(newM);
    setP(newP);
  }, [value]);

  const handleChange = (newH: string, newM: string, newP: string) => {
    setH(newH);
    setM(newM);
    setP(newP);
    onChange(convertTo24Hour(newH, newM, newP));
  };

  const handleHourChange = (val: string) => {
    const numeric = val.replace(/\D/g, "");
    if (numeric === "") {
      setH("");
      return;
    }
    
    let num = parseInt(numeric, 10);
    if (num > 12) num = 12;
    if (num === 0) num = 1; // 12-hour format doesn't have 0, usually 12 is used.
    
    const finalH = String(num);
    setH(finalH);
    onChange(convertTo24Hour(finalH, m, p));
  };

  const handleMinuteChange = (val: string) => {
    const numeric = val.replace(/\D/g, "");
    if (numeric === "") {
      setM("");
      return;
    }

    let num = parseInt(numeric, 10);
    if (num > 59) num = 59;
    
    const finalM = String(num).padStart(2, "0");
    setM(finalM);
    onChange(convertTo24Hour(h, finalM, p));
  };

  const handleBlur = () => {
    // Ensure valid values on blur
    const finalH = h === "" ? "12" : h;
    const finalM = m === "" ? "00" : m.padStart(2, "0");
    
    setH(finalH);
    setM(finalM);
    onChange(convertTo24Hour(finalH, finalM, p));
  };

  const handleTogglePeriod = () => {
    const newP = p === "AM" ? "PM" : "AM";
    setP(newP);
    onChange(convertTo24Hour(h, m, newP));
  };

  const inputStyle = `appearance-none bg-transparent py-2.5 text-sm text-white outline-none text-center hover:text-[#D4AF37] transition-colors w-6 sm:w-8`;

  return (
    <div className={`flex items-center justify-between h-[56px] rounded-[10px] border border-white/10 bg-[#111111] px-2 focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF3720] transition-all ${className} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}>
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          id={`${id}_h`}
          value={h}
          onChange={(e) => handleHourChange(e.target.value)}
          onBlur={handleBlur}
          className={inputStyle}
          placeholder="12"
          disabled={disabled}
        />
        
        <span className="text-white/20 font-medium px-0.5 text-[10px] leading-none">:</span>
        
        <input
          type="text"
          inputMode="numeric"
          id={`${id}_m`}
          value={m}
          onChange={(e) => handleMinuteChange(e.target.value)}
          onBlur={handleBlur}
          className={inputStyle}
          placeholder="00"
          disabled={disabled}
        />
      </div>

      <button
        type="button"
        id={`${id}_p`}
        onClick={handleTogglePeriod}
        className="appearance-none bg-transparent py-2.5 text-xs sm:text-sm font-bold text-[#D4AF37] outline-none cursor-pointer text-center px-3 sm:px-4 hover:text-[#f4d986] transition-colors uppercase shrink-0"
        disabled={disabled}
      >
        {p}
      </button>
    </div>
  );
}
