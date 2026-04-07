import React, { useState, useEffect } from "react";
import { split24Hour, convertTo24Hour, combineTo12HourRange, parse12HourRange } from "../lib/timeUtils";

interface TimeRangePickerProps {
  id: string;
  value: string | null; // Format: "h:mm AM - h:mm PM" or "HH:mm" (fallback)
  onChange: (value: string | null) => void;
  className?: string;
  disabled?: boolean;
}

export function TimeRangePicker({ id, value, onChange, className, disabled }: TimeRangePickerProps) {
  const { start24, end24 } = parse12HourRange(value);

  // Helper for internal state management of each time part
  const setupInternalState = (time24: string) => {
    const { hour, minute, period } = split24Hour(time24);
    return { h: hour, m: minute, p: period };
  };

  type TimeParts = ReturnType<typeof setupInternalState>;

  const [start, setStart] = useState(setupInternalState(start24));
  const [end, setEnd] = useState(setupInternalState(end24));

  useEffect(() => {
    const { start24: s24, end24: e24 } = parse12HourRange(value);
    setStart(setupInternalState(s24));
    setEnd(setupInternalState(e24));
  }, [value]);

  const triggerChange = (newStart: TimeParts, newEnd: TimeParts) => {
    const s24 = convertTo24Hour(newStart.h, newStart.m, newStart.p);
    const e24 = convertTo24Hour(newEnd.h, newEnd.m, newEnd.p);
    onChange(combineTo12HourRange(s24, e24));
  };

  const handleHourChange = (type: "start" | "end", val: string) => {
    const numeric = val.replace(/\D/g, "");
    if (numeric === "") {
       if (type === "start") setStart(p => ({ ...p, h: "" }));
       else setEnd(p => ({ ...p, h: "" }));
       return;
    }
    
    let num = parseInt(numeric, 10);
    if (num > 12) num = 12;
    if (num === 0) num = 1;
    
    const finalH = String(num);
    if (type === "start") {
      const next = { ...start, h: finalH };
      setStart(next);
      triggerChange(next, end);
    } else {
      const next = { ...end, h: finalH };
      setEnd(next);
      triggerChange(start, next);
    }
  };

  const handleMinuteChange = (type: "start" | "end", val: string) => {
    const numeric = val.replace(/\D/g, "");
    if (numeric === "") {
       if (type === "start") setStart(p => ({ ...p, m: "" }));
       else setEnd(p => ({ ...p, m: "" }));
       return;
    }

    let num = parseInt(numeric, 10);
    if (num > 59) num = 59;
    
    const finalM = String(num).padStart(2, "0");
    if (type === "start") {
      const next = { ...start, m: finalM };
      setStart(next);
      triggerChange(next, end);
    } else {
      const next = { ...end, m: finalM };
      setEnd(next);
      triggerChange(start, next);
    }
  };

  const handleBlur = (type: "start" | "end") => {
    if (type === "start") {
      const finalH = start.h === "" ? "12" : start.h;
      const finalM = start.m === "" ? "00" : start.m.padStart(2, "0");
      const next = { ...start, h: finalH, m: finalM };
      setStart(next);
      triggerChange(next, end);
    } else {
      const finalH = end.h === "" ? "12" : end.h;
      const finalM = end.m === "" ? "00" : end.m.padStart(2, "0");
      const next = { ...end, h: finalH, m: finalM };
      setEnd(next);
      triggerChange(start, next);
    }
  };

  const handleTogglePeriod = (type: "start" | "end") => {
    if (type === "start") {
      const newP = start.p === "AM" ? "PM" : "AM";
      const next = { ...start, p: newP };
      setStart(next);
      triggerChange(next, end);
    } else {
      const newP = end.p === "AM" ? "PM" : "AM";
      const next = { ...end, p: newP };
      setEnd(next);
      triggerChange(start, next);
    }
  };

  const inputStyle = `appearance-none bg-transparent py-2.5 text-[16px] sm:text-lg font-medium text-white outline-none text-center hover:text-[#D4AF37] transition-colors w-8 sm:w-10`;
  const periodStyle = `appearance-none bg-transparent py-2.5 text-[14px] sm:text-[15px] font-bold text-[#D4AF37] outline-none cursor-pointer text-center px-1.5 hover:text-[#f4d986] transition-colors uppercase shrink-0`;

  return (
    <div className={`flex items-center justify-start gap-1 sm:gap-4 h-[56px] rounded-[10px] border border-white/10 bg-[#111111] px-2 focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF3720] transition-all ${className} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}>
      {/* Start Time Section */}
      <div className="flex items-center gap-0.5">
        <label className="text-[9px] uppercase text-white/30 mr-1 hidden sm:inline">From</label>
        <div className="flex items-center">
          <input
            type="text"
            inputMode="numeric"
            value={start.h}
            onChange={(e) => handleHourChange("start", e.target.value)}
            onBlur={() => handleBlur("start")}
            className={inputStyle}
            placeholder="12"
            disabled={disabled}
          />
          <span className="text-white/20 font-bold px-0.5 text-[16px] sm:text-lg pb-[2px]">:</span>
          <input
            type="text"
            inputMode="numeric"
            value={start.m}
            onChange={(e) => handleMinuteChange("start", e.target.value)}
            onBlur={() => handleBlur("start")}
            className={inputStyle}
            placeholder="00"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => handleTogglePeriod("start")}
            className={periodStyle}
            disabled={disabled}
          >
            {start.p}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center px-1">
        <span className="h-[2px] w-2.5 bg-[#D4AF3740] rounded-full" />
      </div>

      {/* End Time Section */}
      <div className="flex items-center gap-0.5">
        <label className="text-[9px] uppercase text-white/30 mr-1 hidden sm:inline">To</label>
        <div className="flex items-center">
          <input
            type="text"
            inputMode="numeric"
            value={end.h}
            onChange={(e) => handleHourChange("end", e.target.value)}
            onBlur={() => handleBlur("end")}
            className={inputStyle}
            placeholder="12"
            disabled={disabled}
          />
          <span className="text-white/20 font-bold px-0.5 text-[16px] sm:text-lg pb-[2px]">:</span>
          <input
            type="text"
            inputMode="numeric"
            value={end.m}
            onChange={(e) => handleMinuteChange("end", e.target.value)}
            onBlur={() => handleBlur("end")}
            className={inputStyle}
            placeholder="00"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => handleTogglePeriod("end")}
            className={periodStyle}
            disabled={disabled}
          >
            {end.p}
          </button>
        </div>
      </div>
    </div>
  );
}
