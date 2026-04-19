import Image from 'next/image';

const LogoMark = ({ size = 34 }) => (
  <div style={{ width: size, height: size, position: 'relative' }}>
    <Image
      src="/logo.png"
      alt="The Milano Seal"
      fill
      style={{ objectFit: 'contain' }}
      priority
    />
  </div>
);
<div style={{
  width: 280,
  height: 360,
  position: 'relative',
  borderRadius: 12,
  overflow: 'hidden',
  border: '1px solid rgba(198,165,90,0.3)'
}}>
  <Image
    src="/headshot.jpg"
    alt="Nicholas Milano"
    fill
    style={{ objectFit: 'cover' }}
    priority
  />
</div>
import Image from 'next/image';

const LogoMark = ({ size = 34 }) => (
  <div style={{ width: size, height: size, position: 'relative' }}>
    <Image
      src="/logo.png"
      alt="The Milano Seal"
      fill
      style={{ objectFit: 'contain' }}
    />
  </div>
);
