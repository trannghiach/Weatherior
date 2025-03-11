import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.model";

export type MatchStatus = "waiting" | "playing" | "finished";

@Entity("matches")
export class Match {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, user => user.id, { onDelete: "CASCADE" })
    playerOne!: User;

    @ManyToOne(() => User, user => user.id, { onDelete: "CASCADE" })
    playerTwo!: User;

    @Column({ default: "waiting", name: "match_status" })
    status!: MatchStatus;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
