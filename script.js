const $=document.querySelector.bind(document);
const $$=document.querySelectorAll.bind(document);

const  PLAYER_STORAGE_KEY='Long Tran'

const heading=$('header h2')
const cdThumb=$('.cd-thumb')
const audio=$('#audio')
const cd=$('.cd');
const playBtn=$('.btn-toggle-play');
const player=$('.player');
const progress=$('#progress');
const prevBtn=$('.btn-prev');
const nextBtn=$('.btn-next');
const randomBtn=$('.btn-random');
const repeatBtn=$('.btn-repeat');
const currentTime=$('.currentTime');
const durationTime=$('.durationTime');
const playList=$('.playlist')


const app={
    currentIndex:0,
    isplaying:false,
    isRandom:false,
    isRepeat:false,
    //Danh sách vị trí các bài đẫ nghe
    playedIndexList:[],
    config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY))||{},
    songs:[
        {
            name:'NGỠ NHƯ GIẤC MƠ',
            singer:'CHU DUYÊN',
            path:'./music/NGỠ NHƯ GIẤC MƠ - CHU DUYÊN.mp3',
            image:'./img/ChuDuyen.jpg'
        },
        {
            name:'Khuê Mộc Lang',
            singer:'Changmie Cover',
            path:'./music/Khuê Mộc Lang - Changmie Cover.mp3',
            image:'./img/Changmie.jpg'
        },
        {
            name:'Ái Nộ + Lạc',
            singer:'YLing',
            path:'./music/Mashup ÁI NỘ LẠC - MASEW x KHOI VU x RHYMASTIC - YLing Cover.mp3',
            image:'./img/YLing.jpg'
        },
        {
            name:'Khuê Mộc Lang',
            singer:'Út Nhị',
            path:'./music/Khuê Mộc Lang - Út Nhị.mp3',
            image:'./img/KhueMocLang.jpg'
        },
        {
            name:'Tình Thương Phu Thê',
            singer:'Út Nhị',
            path:'./music/Tình Thương Phu Thê.mp3',
            image:'./img/UtNhi.jpg'
        },
        
    ],

    setConfig:function(key,value) {
        this.config[key]=value;
        localStorage.setItem(PLAYER_STORAGE_KEY,JSON.stringify(this.config));
    },
    render:function() {
        const htmls=this.songs.map((song,index)=>{
            return `
                <div class="song" data-index=${index} >
                    <div class="thumb"
                        style="background-image: url('${song.image}')">
                    </div>
                    <div class="body">
                        <h3 class="title">${song.name}</h3>
                        <p class="author">${song.singer}</p>
                    </div>
                    <div class="option">
                        <i class="fas fa-ellipsis-h"></i>
                    </div>
                </div>
            `
        })
        playList.innerHTML=htmls.join('\n');
    },
    defineProperties:function() {
        Object.defineProperty(this,'currentSong',{
            get:function() {
                return this.songs[this.currentIndex];
            }
        })
    },
    handleEvents:function() {
        const cdWidth=cd.offsetWidth;
        prevIndex=0;

        //Xử lý phóng to, thu nhỏ CD
        document.onscroll=function() {
            const scrollY=window.scrollY;
            const newCdWidth=cdWidth-scrollY;

            cd.style.width=newCdWidth>0?newCdWidth+'px':0;
            cd.style.opacity=newCdWidth/cdWidth;
        }
        //Xử lý khi click play
        playBtn.onclick=function() {
            if(!app.isplaying){
                audio.play();
            }
            else{
                audio.pause();
            }      
        }

        //Xử lý khi chạy audio
        audio.onplay=function() {
            app.isplaying=true;
            cdThumbAnimate.play();
            player.classList.add('playing');
        }
        //Xử lý khi dừng audio
        audio.onpause=function() {
            app.isplaying=false;
            cdThumbAnimate.pause();
            player.classList.remove('playing');
        }

        //Xử lý next song khi audio ended
        audio.onended=function() {
            app.isRepeat?audio.play():nextBtn.click();
        }

        //Xử lý khi dổi bài hát
        audio.onloadedmetadata=function() {
            //active element bài hát đang hát
            var songList=$$('.song');
            
            songList[prevIndex].classList.remove('active');
            songList[app.currentIndex].classList.add('active');

            prevIndex=app.currentIndex;

            //cập nhật thời gian của bài hát đang hát
            durationTime.textContent=changeTimeFormat(Math.floor(audio.duration));
        
            //Cập nhật kéo bài activesong lên khung nhìn
            scrollToActiveSong();
        }


        //Xử lý thanh tiến độ và Cập nhật thời gian phát
        audio.ontimeupdate=function() {
            //Xử lý thanh tiến độ
            if(Number.isNaN(audio.duration))return;
            const progressPercent= audio.currentTime/audio.duration*100;
            progress.value=progressPercent;

            //Cập nhật thời gian phát
            currentTime.textContent=changeTimeFormat(Math.floor(audio.currentTime));
        }

        //Xử lý khi tua
        progress.oninput=function(e) {
            audio.currentTime=e.target.value/100*audio.duration;
        }

        //Xử lý CD quay và dừng
        const cdThumbAnimate=cdThumb.animate([
            {transform:'rotate(360deg)'}
        ],{
            duration: 10000,
            iterations:Infinity //lặp lại vô hạn
        })
        cdThumbAnimate.pause();

        //Khi next
        nextBtn.onclick=function() {
            app.isRandom?app.playRandomSong():app.nextSong();
            audio.play();
        }
        //Khi prev
        prevBtn.onclick=function() {
            app.isRandom?app.playRandomSong():app.prevSong();
            audio.play();
        }
        
        //Khi click random
        randomBtn.onclick=function() {
            app.isRandom=!app.isRandom;
            app.setConfig('isRandom',app.isRandom);
            this.classList.toggle('active');
        }

        //Khi click repeat
        repeatBtn.onclick=function() {
            app.isRepeat=!app.isRepeat;
            app.setConfig('isRepeat',app.isRepeat);
            this.classList.toggle('active');
        }

        //đưa active song nhảy lên khung nhìn
        scrollToActiveSong=function() {
            activeSong=$('.song.active');
            //Tùy chỉnh scroll
                //Những bài đầu sẽ scroll giữa để tránh nằm dưới cd
            if(activeSong.getBoundingClientRect().top<360)
                block='center';
                //Những bài sau sẽ scroll lên vị trí bài trước
            else
                block='nearest';

            scrollOptional={
                behavior:'smooth',
                block:block
            };
            setTimeout(function() {
                $('.song.active').scrollIntoView(scrollOptional)
            }, 300);
        }

        //Lắng nghe hành vi click vào playlist
        playList.onclick=function(e){
            const songNode= e.target.closest('.song:not(.active)');
            //Closet- Tìm chính nó hoặc tổ tiên cho đến khi dc element thỏa dk
            if(songNode||e.target.closest('.option')){
                //Xử lý click vào song
                if(songNode&&!e.target.closest('.option')){
                    app.currentIndex=Number(songNode.dataset.index);
                    app.loadCurrentSong();
                    audio.play();
                }

                //Xử lý click vào song option
                if(e.target.closest('.option')){
                    
                }
            }
        }
        
    },
    loadCurrentSong:function() {
        heading.textContent=this.currentSong.name;
        cdThumb.style.backgroundImage=`url('${this.currentSong.image}')`;
        audio.src=this.currentSong.path;
    },

    loadconfig:function() {
        this.isRandom=this.config.isRandom;
        if(this.isRandom)
            randomBtn.classList.add('active');
        this.isRepeat=this.config.isRepeat;
        if(this.isRepeat)
            repeatBtn.classList.add('active');
    },

    nextSong:function(){
        this.currentIndex++;
        if(this.currentIndex>=this.songs.length){
            this.currentIndex=0;
        }
        this.loadCurrentSong();
    },

    playRandomSong:function(){
        //Thêm bài đầu tiên vào danh sách đã nghe
        if(!this.playedIndexList.includes(this.currentIndex))
            this.playedIndexList.push(this.currentIndex);
        do{
            newRandomIndex=Math.floor(Math.random()*this.songs.length);
        }
        //Lập khi nhận trùng bài hoặc nằm trong danh sách đã nghe
        while(this.currentIndex===newRandomIndex||this.playedIndexList.includes(newRandomIndex))
        this.currentIndex=newRandomIndex;

        //Thêm vào  danh sách đã nghe
        this.playedIndexList.push(this.currentIndex);

        //Xóa danh sách khi đã nghe đủ bài
        if(this.playedIndexList.length===this.songs.length)
            this.playedIndexList=[];
        this.loadCurrentSong();
    },

    prevSong:function(){
        this.currentIndex--;
        if(this.currentIndex<0){
            this.currentIndex=this.songs.length-1;
        }
        this.loadCurrentSong();
    },

    start: function(){
        //Gán cấu hình từ config vào ứng dụng
        this.loadconfig();

        //Định nghĩa các thuộc tính cho obj
        this.defineProperties();

        // Lắng nghe / xử lý các sự kiện
        this.handleEvents();

        //Tải thông tin bài hát đầu tiên vào UI khi chạy ứng dụng
        this.loadCurrentSong();

        //Render playlist
        this.render();
    }
}

app.start();

function changeTimeFormat (time) {
    timeFomatted='';
    if(time>3600){
        hour=parseInt(time/3600);
        time%=3600;
        hourFomatted=hour.toString().length==1?'0'+hour:hour;
        timeFomatted+=hourFomatted+':'
    }
    //Xử lý phút
    minute=parseInt(time/60) ;
    //hiện thị hai chữ sô
    minuteFomatted=minute.toString().length==1?'0'+minute:minute;
    timeFomatted+=minuteFomatted+':';
    //Xử lý giay
    second=time%60;
    secondFomatted=second.toString().length==1?'0'+second:second;
    timeFomatted+=secondFomatted;
    return timeFomatted;
    
}
