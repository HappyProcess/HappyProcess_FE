type TooltipData ={
  xAnchor?: 'left' | 'center' | 'right';
  yAnchor?: 'top' | 'center' | 'bottom';
  alwaysFocus?: boolean;
  isOuter?: boolean;
  content:string
}

export default function Tooltip({
  content,
  xAnchor = 'center',
  yAnchor = 'center',
  alwaysFocus = false,
  isOuter = false
}: TooltipData){
  let xClass = '';
  let xTrans = '';
  let yClass = '';
  let yTrans = '';

  switch (xAnchor) {
    case 'center':
      xClass = 'left-1/2';
      xTrans = '-translate-x-1/2';
      break;
    case 'right':
      xClass = '';
      xTrans = isOuter? 'ml-1': '-translate-x-full -ml-1';
      break;
    default:
      xClass = 'left-0';
      xTrans = isOuter? '-translate-x-full -ml-1' : 'ml-1';
  }
  switch (yAnchor) {
    case 'center':
      yClass = 'top-1/2';
      yTrans = '-translate-y-1/2';
      break;
    case 'bottom':
      yClass = 'top-full';
      yTrans = isOuter? '-translate-y-full -mt-1' : 'mt-1';
      break;
    default:
      yClass = 'top-0';
      yTrans = isOuter? 'mt-1' : '-translate-y-full -mt-1';
  }

  return (
    <span
    className={`${xClass} ${yClass} ${xTrans} ${yTrans} w-max z-10 absolute invisible inline-block px-3 py-2 text-xs font-medium text-white bg-[rgba(0,0,0,0.7)] rounded-lg shadow-xs opacity-0 ${alwaysFocus ? 'opacity-100 visible' : 'group-hover:opacity-100 group-hover:visible'} transition-opacity`}
    >
      {content}
    </span>
  )
}