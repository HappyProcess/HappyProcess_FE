'use client'
import { useState } from "react";
import { getSigungu, getDong } from "#/service/region";

type DongItem = { areaNo: string; dong: string };

type Props = {
  className?: string;
  required?: boolean;
  value: string;
  onChange: (areaNo: string) => void;
  sidoList: string[];
};

export default function RegionSelect({ className, required = false, value, onChange, sidoList }: Props) {
  const [sigunguList, setSigunguList] = useState<string[]>([]);
  const [dongList, setDongList] = useState<DongItem[]>([]);

  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [dong, setDong] = useState("");

  const [loading, setLoading] = useState({ sigungu: false, dong: false });

  const handleSidoChange = async (newSido: string) => {
    setSido(newSido);
    setSigungu("");
    setDong("");
    setSigunguList([]);
    setDongList([]);
    onChange("");

    if (!newSido) return;
    setLoading((l) => ({ ...l, sigungu: true }));
    getSigungu(newSido)
      .then(setSigunguList)
      .finally(() => setLoading((l) => ({ ...l, sigungu: false })));

  };

  const handleSigunguChange = async (newSigungu: string) => {
    setSigungu(newSigungu);
    setDong("");
    setDongList([]);
    onChange("");

    if (!newSigungu) return;
    setLoading((l) => ({ ...l, dong: true }));
    getDong(sido, newSigungu)
      .then(setDongList)
      .finally(() => setLoading((l) => ({ ...l, dong: false })));
  };

  const handleDongChange = (areaNo: string) => {
    setDong(areaNo);
    onChange(areaNo);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <select
        value={sido}
        className={className}
        required={required}
        disabled={sidoList.length === 0}
        onChange={(e) => handleSidoChange(e.target.value)}
      >
        <option value="">시도</option>
        {sidoList.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        value={sigungu}
        className={className}
        required={required}
        disabled={!sido || loading.sigungu}
        onChange={(e) => handleSigunguChange(e.target.value)}
      >
        <option value="">시군구</option>
        {sigunguList.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {sigungu && !loading.dong && dongList.length > 0 && (
        <select
          value={dong}
          className={className}
          required={required}
          onChange={(e) => handleDongChange(e.target.value)}
        >
          <option value="">동</option>
          {dongList.map((d) => (
            <option key={d.areaNo} value={d.areaNo}>{d.dong}</option>
          ))}
        </select>
      )}

    </div>
  );
}
