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

    local procedure AnalysisDemo2()
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

    local procedure AnalysisDemo3(IntPar: Record Integer;)            
    begin
        IntPar.Reset();
        IntPar.SetRange(Number, 1, 5);
        if IntPar.Findset then begin
            repeat
            until IntPar.Next() = 0;
        end;
    end;

    local procedure AnalysisDemo3(var IntVar: Record Integer;)            
    begin
        IntVar.Reset();
        IntVar.SetRange(Number, 1, 5);
        if IntVar.Findset then begin
            repeat
            until IntVar.Next() = 0;
        end;
    end;

    local procedure AnalysisDemo4(var IntVar: Record Integer;)            
    begin
        IntVar.Reset();        
        IntVar.SetFilter(Number, '%1..%2', 1, 5);
        if IntVar.Findset then begin
            repeat
            until IntVar.Next() = 0;
        end;
    end;

    local procedure AnalysisDemo5(Test: Record "Sales Line", var IntVar: Record Integer;)            
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

}