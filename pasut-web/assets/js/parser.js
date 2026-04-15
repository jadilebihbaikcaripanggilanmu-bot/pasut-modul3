(function () {
  function excelDateToJSDate(serial) {
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    const fractionalDay = serial - Math.floor(serial) + 0.0000001;
    let totalSeconds = Math.floor(86400 * fractionalDay);
    const seconds = totalSeconds % 60;
    totalSeconds -= seconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds / 60) % 60;

    return new Date(Date.UTC(
      dateInfo.getUTCFullYear(),
      dateInfo.getUTCMonth(),
      dateInfo.getUTCDate(),
      hours,
      minutes,
      seconds
    ));
  }

  function parseDateValue(value) {
    if (value == null || value === '') return null;

    if (value instanceof Date && !isNaN(value.getTime())) {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      if (value > 10000) {
        const date = excelDateToJSDate(value);
        return isNaN(date.getTime()) ? null : date;
      }
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;

      const native = new Date(trimmed);
      if (!isNaN(native.getTime())) {
        return native;
      }

      const slashPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
      const match = trimmed.match(slashPattern);
      if (match) {
        const month = Number(match[1]) - 1;
        const day = Number(match[2]);
        const year = Number(match[3]);
        const hour = Number(match[4]);
        const minute = Number(match[5]);
        const second = Number(match[6] || 0);
        return new Date(Date.UTC(year, month, day, hour, minute, second));
      }
    }

    return null;
  }

  function toNumber(value) {
    if (value == null || value === '') return NaN;
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    const normalized = String(value).trim().replace(',', '.');
    if (!normalized) return NaN;
    const num = Number(normalized);
    return Number.isFinite(num) ? num : NaN;
  }

  function cleanHeader(header) {
    return String(header == null ? '' : header)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function headerToKey(header) {
    return cleanHeader(header)
      .toLowerCase()
      .replace(/\([^)]*\)/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function detectTimeColumn(headers) {
    const idx = headers.findIndex((h) => /time|waktu/i.test(h));
    return idx >= 0 ? idx : 0;
  }

  function detectSensorColumns(headers, dataRows) {
    const sensors = [];

    headers.forEach((header, index) => {
      const label = cleanHeader(header);
      const key = headerToKey(label);
      const lower = label.toLowerCase();

      if (!label) return;
      if (/time|waktu/i.test(label)) return;
      if (/^bat/i.test(lower) || /\(v\)/i.test(label)) return;

      const sampleValues = dataRows
        .slice(0, 25)
        .map((row) => toNumber(row[index]))
        .filter((v) => Number.isFinite(v));

      if (!sampleValues.length) return;

      sensors.push({
        index,
        key,
        label,
      });
    });

    return sensors;
  }

  function normalizeRowLength(row, length) {
    const out = Array.isArray(row) ? row.slice() : [];
    while (out.length < length) out.push('');
    return out;
  }

  async function parseSpreadsheetFile(file) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', raw: true, cellDates: true });

    if (!workbook.SheetNames.length) {
      throw new Error('Workbook kosong.');
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: '',
      blankrows: false,
    });

    if (rows.length < 3) {
      throw new Error('Format file minimal harus punya 3 baris: nama stasiun, header, lalu data.');
    }

    const stationName = cleanHeader((rows[0] && rows[0][0]) || 'Stasiun tanpa nama');
    const headers = normalizeRowLength(rows[1], rows[1].length).map(cleanHeader);
    const timeIndex = detectTimeColumn(headers);
    const dataRows = rows.slice(2).map((row) => normalizeRowLength(row, headers.length));
    const sensors = detectSensorColumns(headers, dataRows);

    if (!sensors.length) {
      throw new Error('Tidak ada kolom sensor yang terdeteksi. Pastikan header sensor seperti prs(m), ra2(m), rad(m), atau ras(m).');
    }

    const points = [];

    dataRows.forEach((row) => {
      const time = parseDateValue(row[timeIndex]);
      if (!time) return;

      const values = {};
      sensors.forEach((sensor) => {
        values[sensor.key] = toNumber(row[sensor.index]);
      });

      points.push({ time, values });
    });

    if (!points.length) {
      throw new Error('Tidak ada data waktu yang berhasil dibaca dari file.');
    }

    points.sort((a, b) => a.time - b.time);

    return {
      stationName,
      headers,
      sensors,
      points,
      fileName: file.name,
    };
  }

  window.PasutParser = {
    parseSpreadsheetFile,
    toNumber,
    parseDateValue,
    headerToKey,
    cleanHeader,
  };
})();
