import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { AgoraRtcStreamHandlerService, DashboardViewEnum } from 'src/app/shared';

@Component({
    selector: 'app-attendee-cart',
    templateUrl: './attendee-cart.component.html',
    styleUrls: ['./attendee-cart.component.scss']
})
export class AttendeeCartComponent implements OnInit, OnChanges {
    // public view_state = DashboardViewEnum.NONE;

    public views = {
        NONE: DashboardViewEnum.NONE,
        ALL: DashboardViewEnum.ALL,
        MEDIA_ONLY: DashboardViewEnum.MEDIA_ONLY,
        CHAT_ONLY: DashboardViewEnum.CHAT_ONLY
    };

    @Input() profile_card_banner: string;
    @Input() view_state: number;

    @Input() attendee_Profile_picture: string;
    @Input() attendee_name: string;
    @Input() attendee_tagline: string;
    @Input() participant_id: number;
    @Input() is_moderator = false;
    @Input() is_fake = true;
    @Input() selected_participant_user_id: string;
    @Input() participant_user_id: string;
    @Input() text_limit: number[];
    @Input() is_available_for_sidechat: boolean;
    @Input() sidechat_call: any;

    @Output() attendeeSelected = new EventEmitter<number>();

    nameLimit: number = 15;
    tagLimit: number = 25;
    loadPulseAnimation: boolean = false;

    constructor(public agoraRTCStreamHandler: AgoraRtcStreamHandlerService) {
    }

    ngOnInit(): void {
    }

    // changes.prop contains the old and the new value...
    ngOnChanges(changes: SimpleChanges) {
        /* if (changes && changes.attendee_name && changes.attendee_name.currentValue) {
            this.attendee_name = this.is_moderator ? `${this.attendee_name} | Moderator` : this.attendee_name;
        } */

        if(this.text_limit?.length > 1){
            this.nameLimit = this.text_limit[0];
            this.tagLimit = this.text_limit[1];
        }
    }

    loadAnimation(){
        this.loadPulseAnimation = true
    }

    attendeeCartSelected(participantUserId) {
        //emit to parent component
        if (participantUserId) {
            this.attendeeSelected.emit(participantUserId);
        }
    }

}
