page 50100 TestPageExt
{
    PageType = List;
    SourceTable = Integer;

    layout
    {
        area(Content)
        {
            group(Grp1)
            {
                field(Number; Rec.Number)
                {
                    ApplicationArea = All;
                    Caption = 'Number';
                }
            }
        }
    }
    actions
    {
        area(Processing)
        {
            action(DummyAction)
            {
                Caption = 'Dummy Action';
                Image = LineDescription;
#pragma warning disable kvs_invalid_application_area
                ApplicationArea = KVSMEDXYZ;
#pragma warning restore kvs_invalid_application_area

                trigger OnAction()
                begin
                    Page.RunModal(0, Rec);
                end;
            }
        }
    }

    var
        MsgLbl: Label 'App published: Hello world';

    trigger OnOpenPage();
    begin
        Message(MsgLbl);
        Rec.SetRange(Number, 1, 10);
    end;

#pragma warning disable kvs_global_procedure
    procedure AnalysisDemo1()
    var
        IntegerLoc: Record Integer;
    begin
        IntegerLoc.Reset();
        IntegerLoc.SetRange(Number, 1, 5);
        if IntegerLoc.Findset then begin
            repeat
            until IntegerLoc.Next() = 0;
        end;
    end;

    procedure AnalysisDemo2()
    var
        IntLoc: Record Integer;
    begin
        IntLoc.Reset();
        IntLoc.SetRange(Number, 1, 5);
        if IntLoc.Findset then begin
            repeat
            until IntLoc.Next() = 0;
        end;
    end;
#pragma warning restore kvs_global_procedure

    local procedure AnalysisDemo3(IntPar: Record Integer)
    begin
        IntPar.Reset();
        IntPar.SetRange(Number, 1, 5);
        if IntPar.Findset then begin
            repeat
            until IntPar.Next() = 0;
        end;
    end;

    local procedure AnalysisDemo3(var IntVar: Record Integer)
    begin
        IntVar.Reset();
        IntVar.SetRange(Number, 1, 5);
        if IntVar.Findset then begin
            repeat
            until IntVar.Next() = 0;
        end;
    end;

    local procedure AnalysisDemo4(var IntVar: Record Integer)
    begin
        IntVar.Reset();
        IntVar.SetFilter(Number, '%1..%2', 1, 5);
        if IntVar.Findset then begin
            repeat
            until IntVar.Next() = 0;
        end;
    end;

    local procedure AnalysisDemo5(Test: Record "Sales Line"; var IntVar: Record Integer)
    var
        MetaData: Record Integer;
    begin
        IntVar.Reset();
        // Störfaktor Kommentar
        IntVar.SetFilter(Number, '%1..%2', 1, 5);
        if IntVar.Findset then begin
            repeat

            // Noch mehr Störfaktoren


            until IntVar.Next() = 0;
        end;
    end;

    procedure AnalysisDemo6(Test: Record "Sales Line"; var IntVar: Record Integer)
    var
        MetaData: Record Integer;
    begin
        Rec.Reset();
        // Störfaktor Kommentar
        Rec.SetFilter(Number, '%1..%2', 1, 5);
        if Rec.Findset then begin
            repeat

            // Noch mehr Störfaktoren


            until Rec.Next() = 0;
        end;
    end;

    local procedure AnalysisDemo7(Test: Record "Sales Line"; var IntVar: Record Integer)
    var
        MetaData: Record Integer;
    begin
        Reset();
        // Störfaktor Kommentar
        SetFilter(Number, '%1..%2', 1, 5);
        if FindSet then begin
            repeat

            // Noch mehr Störfaktoren


            until Next() = 0;
        end;
    end;


}