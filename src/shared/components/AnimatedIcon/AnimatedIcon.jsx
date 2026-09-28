import { classNames } from '@/shared/utils/classNames';
import './AnimatedIcon.css';

export default function AnimatedIcon({ icon: Icon, iconRef, size = 18, className, ...rest }) {
  return (
    <Icon
      ref={iconRef}
      size={size}
      className={classNames('animated-icon', className)}
      aria-hidden="true"
      {...rest}
    />
  );
}
