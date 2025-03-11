
import { compareValue, hashValue } from "../utils/bcrypt";
import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Session } from "./session.model";
import { Match } from "./match.model";
import { Ranking } from "./ranking.model";


@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column({ default: false })
    verified!: boolean;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;

    @OneToMany(() => Session, session => session.user)
    sessions!: Session[];

    @OneToMany(() => Match, match => match.playerOne || match.playerTwo)
    matches!: Match[];

    @OneToMany(() => Ranking, ranking => ranking.user)
    rankings!: Ranking[];

    @BeforeInsert()
    async hashPassword() {
        this.password = await hashValue(this.password);
    }

    async comparePassword(password: string): Promise<boolean> {
        return compareValue(password, this.password);
    }

    omitPassword() {
        const { password, ...user } = this;
        return user;
    }
}