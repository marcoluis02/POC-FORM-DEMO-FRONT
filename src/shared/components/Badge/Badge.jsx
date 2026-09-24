import { classNames } from '@/shared/utils/classNames';
import './Badge.css';

// tone: neutral | info | success | warning | danger
export default function Badge({ tone = 'neutral', children }) {
  return <span className={classNames('badge', `badge--${tone}`)}>{children}</span>;
}
