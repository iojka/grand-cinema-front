import { useTranslation } from 'react-i18next';
import { groupByRow } from '../utils/programme.js';

// États d'une place dans la légende (SELECTED : choisie, US 2.2)
const LEGEND = ['FREE', 'SELECTED', 'HELD', 'SOLD'];

/**
 * Plan de salle : écran, places par rangée et légende (US 2.1)
 * Utilisé par le site (US 2.2) et par le guichet (US 7.2) : le même plan
 * @param {object} props seats (places de l'API), selected (id des places
 *   choisies), onToggle (clic sur une place libre)
 */
function SeatGrid({ seats, selected, onToggle }) {
  const { t } = useTranslation();

  return (
    <>
      <p className="screen">{t('seats.screen')}</p>
      <div className="seats">
        {groupByRow(seats).map((line) => (
          <div key={line.row} className="seats__row">
            <span className="seats__label">{line.row}</span>
            {line.seats.map((seat) => {
              const label = `${seat.row}${seat.number} ${t(`seats.status.${seat.status}`)}`;
              const isSelected = selected.includes(seat.id);
              let className = `seat seat--${seat.status.toLowerCase()}`;
              if (isSelected) {
                className += ' seat--selected';
              }
              if (seat.is_accessible) {
                className += ' seat--accessible';
              }
              // Place libre : bouton cliquable
              if (seat.status === 'FREE') {
                return (
                  <button
                    key={seat.id}
                    type="button"
                    className={className}
                    aria-label={label}
                    aria-pressed={isSelected}
                    title={label}
                    onClick={() => onToggle(seat.id)}
                  >
                    {seat.number}
                  </button>
                );
              }
              return (
                <span
                  key={seat.id}
                  className={className}
                  aria-label={label}
                  title={label}
                >
                  {seat.number}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <ul className="legend">
        {LEGEND.map((status) => (
          <li key={status}>
            <span
              className={`seat seat--${status.toLowerCase()}`}
              aria-hidden="true"
            ></span>
            {t(`seats.legend.${status}`)}
          </li>
        ))}
        <li>
          <span className="seat seat--accessible" aria-hidden="true"></span>
          {t('seats.legend.accessible')}
        </li>
      </ul>
    </>
  );
}

export default SeatGrid;
