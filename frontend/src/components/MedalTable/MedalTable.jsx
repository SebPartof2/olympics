import { useState } from 'react';
import styles from './MedalTable.module.css';

function MedalTable({ data, limit = null, showSearch = false }) {
  const [sortBy, setSortBy] = useState('gold');
  const [sortOrder, setSortOrder] = useState('desc');
  const [search, setSearch] = useState('');

  const sortedData = [...data]
    .filter((country) =>
      search === '' || country.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      const diff = (b[sortBy] || 0) - (a[sortBy] || 0);
      return sortOrder === 'asc' ? -diff : diff;
    });

  const displayData = limit ? sortedData.slice(0, limit) : sortedData;

  function handleSort(column) {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  }

  function SortIcon({ column }) {
    if (sortBy !== column) return null;
    return <span className={styles.sortIcon}>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  }

  if (data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No medal data available yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {showSearch && (
        <div className={styles.search}>
          <input
            type="text"
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.rankCol}>Rank</th>
              <th
                className={`${styles.sortable} ${styles.countryCol}`}
                onClick={() => handleSort('name')}
              >
                Country <SortIcon column="name" />
              </th>
              <th
                className={`${styles.sortable} ${styles.medalCol}`}
                onClick={() => handleSort('gold')}
              >
                <span className={`medal medal-gold`}>G</span>
                <SortIcon column="gold" />
              </th>
              <th
                className={`${styles.sortable} ${styles.medalCol}`}
                onClick={() => handleSort('silver')}
              >
                <span className={`medal medal-silver`}>S</span>
                <SortIcon column="silver" />
              </th>
              <th
                className={`${styles.sortable} ${styles.medalCol}`}
                onClick={() => handleSort('bronze')}
              >
                <span className={`medal medal-bronze`}>B</span>
                <SortIcon column="bronze" />
              </th>
              <th
                className={`${styles.sortable} ${styles.totalCol}`}
                onClick={() => handleSort('total')}
              >
                Total <SortIcon column="total" />
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((country, index) => (
              <tr key={country.id || country.code}>
                <td className={styles.rankCol}>
                  <span className={styles.rank}>{index + 1}</span>
                </td>
                <td className={styles.countryCol}>
                  <div className={styles.countryInfo}>
                    {country.flag_url ? (
                      <img src={country.flag_url} alt={country.code} className={styles.flag} />
                    ) : (
                      <span className={styles.countryCode}>{country.code}</span>
                    )}
                    <span className={styles.countryName}>{country.name}</span>
                  </div>
                </td>
                <td className={styles.medalCol}>
                  <span className={styles.medalCount}>{country.gold || 0}</span>
                </td>
                <td className={styles.medalCol}>
                  <span className={styles.medalCount}>{country.silver || 0}</span>
                </td>
                <td className={styles.medalCol}>
                  <span className={styles.medalCount}>{country.bronze || 0}</span>
                </td>
                <td className={styles.totalCol}>
                  <span className={styles.totalCount}>{country.total || 0}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {displayData.length === 0 && search && (
        <p className={styles.noResults}>No countries match "{search}"</p>
      )}
    </div>
  );
}

export default MedalTable;
