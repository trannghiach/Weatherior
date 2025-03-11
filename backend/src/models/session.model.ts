import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, BeforeInsert, JoinColumn } from "typeorm";
import { User } from "./user.model";
import { thirtyDaysFromNow } from "../utils/date";


@Entity("sessions")
export class Session {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, user => user.sessions, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ name: "user_agent", nullable: true })
    userAgent?: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @Column({ name: "expires_at", type: "timestamp" })
    expiresAt!: Date;

    @BeforeInsert()
    setExpiration() {
        this.expiresAt = thirtyDaysFromNow();
    }
}
