
import { compareValue, hashValue } from "../utils/bcrypt";
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';


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