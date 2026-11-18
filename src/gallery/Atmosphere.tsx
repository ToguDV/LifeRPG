import styles from './Atmosphere.module.css'

export function Atmosphere() {
  return (
    <div className={styles.atmosphere} aria-hidden="true">
      <svg
        className={styles.map}
        viewBox="0 0 1440 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.1" opacity=".055">
          <path d="M-60 214C104 144 232 252 398 222S688 96 878 158s332 154 632 74" />
          <path d="M-70 260C96 194 236 300 406 270S704 144 892 204s336 148 616 72" />
          <path d="M-80 306C88 244 240 348 414 318S720 192 906 250s340 140 602 68" />
          <path d="M-90 458C118 382 268 478 470 446S764 330 970 386s334 128 560 54" />
          <path d="M-70 508C128 436 290 524 486 494S786 382 988 434s306 116 522 44" />
          <path d="M-40 796C152 716 346 806 548 762S880 622 1084 688s272 94 436 36" />
          <path d="M-30 850C166 774 360 858 566 816S906 682 1102 746s256 82 408 28" />
          <path d="M-40 914C156 840 364 918 572 878S924 754 1118 812s244 68 392 18" />
        </g>
        <g fill="none" stroke="currentColor" strokeOpacity=".07" strokeDasharray="4 9" strokeWidth="1.2">
          <path d="M182 742C302 648 402 682 540 654s270-128 414-114 228 42 342-40" />
        </g>
        <g fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeOpacity=".14">
          <circle cx="540" cy="654" r="3.5" />
          <circle cx="954" cy="540" r="3.5" />
          <circle cx="182" cy="742" r="3.5" />
        </g>
        <g fill="none" stroke="currentColor" strokeOpacity=".045">
          <circle cx="1240" cy="188" r="78" />
          <circle cx="1240" cy="188" r="54" />
          <path d="M1240 74v228M1126 188h228" />
          <path d="M1240 110c9 50 39 79 88 88-49 9-79 38-88 88-9-50-39-79-88-88 49-9 79-38 88-88Z" />
        </g>
      </svg>
      <div className={styles.motes}>
        {Array.from({ length: 10 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
    </div>
  )
}
